import { EventTarget } from "event-target-shim";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";

// Delay we wait before flushing a room rename since the user
// can keep typing in the UI.
const ROOM_RENAME_DELAY = 1000;

export default class Matrix extends EventTarget {
  constructor(store) {
    super();
    this.store = store;
    this.pendingRoomJoinPromises = new Map();
    this.pendingRoomJoinResolvers = new Map();
    this.roomNameChangeTimeouts = new Map();

    // Hub <-> room bimap
    this.hubIdToRoomId = new Map();
    this.roomIdToHubId = new Map();

    // Map of space ID -> spaceroom roomId
    this.spaceIdToRoomId = new Map();

    this.initialSyncPromise = new Promise(res => {
      this.initialSyncFinished = res;
    });
  }

  async init(homeserver, loginToken, expectedUserId) {
    const { store } = this;
    const { accountChannel } = window.APP;

    this.homeserver = homeserver;
    let accessToken = store.state.credentials.matrix_access_token;
    let userId = null;

    // Check validity of current access token
    if (accessToken) {
      await new Promise(res => {
        fetch(`https://${homeserver}/_matrix/client/r0/account/whoami`, {
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`
          }
        }).then(response => {
          if (response.status !== 200) {
            accessToken = null;
            res();
          } else {
            response.json().then(whoami => {
              const currentUserId = whoami["user_id"];

              if (currentUserId !== expectedUserId) {
                accessToken = null;
              } else {
                userId = whoami["user_id"];
              }

              res();
            });
          }
        });
      });
    }

    // If missing access token, use JWT to re-log in
    if (!accessToken) {
      const loginRes = await fetch(`https://${homeserver}/_matrix/client/r0/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "org.matrix.login.jwt", token: loginToken })
      });

      const { user_id, access_token: matrix_access_token } = await loginRes.json();
      store.update({ credentials: { matrix_access_token } });

      accessToken = matrix_access_token;
      userId = user_id;
    }

    console.log("Logged into matrix as", userId);

    // Set up client in ifrmae
    await waitForDOMContentLoaded();

    const uiClient = document.getElementById("jel-matrix-client");

    await new Promise(res => {
      uiClient.addEventListener("load", res, { once: true });
      uiClient.setAttribute("src", "/matrix/");
    });

    await waitForDOMContentLoaded(uiClient.contentDocument, uiClient.contentWindow);

    const res = new Promise((res, rej) => {
      // Inner client calls this and passes matrix client.
      uiClient.contentWindow.onPreClientStart = client => {
        this.client = client;

        this._attachMatrixEventHandlers();

        this.client.once("sync", async state => {
          if (state === "PREPARED") {
            this._joinMissingRooms();

            accountChannel.addEventListener("account_refresh", () => {
              // Memberships may have changed, so join missing space rooms.
              this._joinMissingRooms();
            });

            this.initialSyncFinished();

            res();
          } else {
            rej();
          }
        });
      };
    });

    const { getLoadedSession, getLifecycle, getDispatcher } = uiClient.contentWindow;
    const innerSession = await getLoadedSession;
    const lifecycle = await getLifecycle;
    this._uiDispatcher = await getDispatcher;

    if (!innerSession) {
      await lifecycle.setLoggedIn({
        homeserverUrl: `https://${homeserver}`,
        identityServerUrl: `https://${homeserver}`,
        userId,
        accessToken
      });
    }

    return res;
  }

  updateRoomNameForHub(hubId, name) {
    const { client, roomNameChangeTimeouts, hubIdToRoomId } = this;

    const roomId = hubIdToRoomId.get(hubId);
    if (!roomId) return;

    const timeout = roomNameChangeTimeouts.get(roomId);

    if (timeout) {
      clearTimeout(timeout);
    }

    roomNameChangeTimeouts.set(
      roomId,
      setTimeout(() => {
        const room = client.getRoom(roomId);

        if (room && this._roomCan("state:m.room.name", roomId)) {
          client.setRoomName(roomId, name);
        }
      }, ROOM_RENAME_DELAY)
    );
  }

  roomForHubCan(permission, hubId) {
    const { hubIdToRoomId } = this;

    const roomId = hubIdToRoomId.get(hubId);
    if (!roomId) return false;

    return this._roomCan(permission, roomId);
  }

  async switchClientToRoomForHub({ hub_id: hubId }) {
    await this.switchClientToRoomForHubId(hubId);
  }

  async switchClientToRoomForHubId(hubId) {
    const { hubIdToRoomId } = this;

    const roomId = hubIdToRoomId.get(hubId);
    if (!roomId) return;

    await this.initialSyncPromise;

    this._uiDispatcher.dispatch({
      action: "view_room",
      room_id: roomId
    });
  }

  updateRoomOrderForHubId(hubId, order) {
    const { client, hubIdToRoomId } = this;
    const roomId = hubIdToRoomId.get(hubId);

    if (!roomId) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    const spaceId = this._spaceIdForRoom(room);
    if (!spaceId) return;

    const spaceRoomId = this.spaceIdToRoomId.get(spaceId);
    if (!spaceRoomId) return;

    const spaceRoom = client.getRoom(spaceRoomId);
    if (!spaceRoom) return;

    const childRooms = spaceRoom.currentState.events.get("m.space_child");
    if (!childRooms) return;

    let currentOrder = null;

    for (const [
      childRoomId,
      {
        event: {
          content: { order }
        }
      }
    ] of childRooms.entries()) {
      if (childRoomId === roomId) {
        currentOrder = order;
      }
    }

    if (currentOrder !== `${order}`) {
      window.APP.accountChannel.setMatrixRoomOrder(roomId, order);
    }
  }

  _roomCan(permission, roomId) {
    const { client } = this;

    const room = client.getRoom(roomId);
    if (!room) return false;

    if (permission.startsWith("state:")) {
      const stateEvent = permission.substring(6);
      return room.currentState.maySendStateEvent(stateEvent, client.credentials.userId);
    } else {
      console.warn("Checking non-implemented permission", permission);
      return false;
    }
  }

  async _joinMissingRooms() {
    const { memberships } = window.APP.accountChannel;

    // Join each Jel space's matrix room, then walk all the children
    // matrix rooms and join the ones marked auto_join=true
    for (const {
      space: { matrix_spaceroom_id }
    } of memberships) {
      if (!matrix_spaceroom_id) continue;

      const spaceRoom = await this._ensureRoomJoined(matrix_spaceroom_id);

      // Walk each child room (channels) and join them if auto_join = true
      const childRooms = spaceRoom.currentState.events.get("m.space_child");

      if (childRooms) {
        for (const [
          roomId,
          {
            event: {
              content: { via, auto_join }
            }
          }
        ] of childRooms.entries()) {
          if (!via || !auto_join) continue;

          this._ensureRoomJoined(roomId);
        }
      }
    }
  }

  _ensureRoomJoined(roomId) {
    const { client } = this;
    const room = client.getRoom(roomId);
    if (room && room.hasMembershipState(client.credentials.userId, "join")) return Promise.resolve(room);

    // Stash a promise that will be resolved once the join is complete.
    let promise = this.pendingRoomJoinPromises.get(roomId);

    if (!promise) {
      promise = new Promise(res => {
        this.pendingRoomJoinResolvers.set(roomId, res);
      });

      this.pendingRoomJoinPromises.set(roomId, promise);

      window.APP.accountChannel.joinMatrixRoom(roomId);
    }

    return promise;
  }

  _spaceIdForRoom(room) {
    if (this._jelTypeForRoom(room) === "jel.space") {
      return room.currentState.events.get("jel.space").get("").event.content.space_id;
    } else if (this._jelTypeForRoom(room) === "jel.hub") {
      for (const spaceId of room.currentState.events.get("jel.space.parent").keys()) {
        return spaceId;
      }
    }
  }

  _jelTypeForRoom(room) {
    return room.currentState.events.get("jel.type").get("").event.content.type;
  }

  _isHubRoomForCurrentSpace(room) {
    const { spaceId } = window.APP.spaceChannel;

    return this._spaceIdForRoom(room) === spaceId && this._jelTypeForRoom(room) === "jel.hub";
  }

  _isSpaceRoomForCurrentSpace(room) {
    const { spaceId } = window.APP.spaceChannel;

    return this._spaceIdForRoom(room) === spaceId && this._jelTypeForRoom(room) === "jel.space";
  }

  _attachMatrixEventHandlers() {
    const { client } = this;

    client.on("Room.myMembership", async room => {
      if (!client.isInitialSyncComplete()) return;

      if (room.hasMembershipState(client.credentials.userId, "join")) {
        const { roomId } = room;
        const pendingJoinPromiseResolver = this.pendingRoomJoinResolvers.get(roomId);

        if (pendingJoinPromiseResolver) {
          this.pendingRoomJoinPromises.delete(roomId);
          this.pendingRoomJoinResolvers.delete(roomId);
          pendingJoinPromiseResolver(room);
        }

        // If we just joined a room, the user may be waiting on the UI to update.
        const hubId = window.APP.hubChannel.hubId;
        const desiredRoomId = this.hubIdToRoomId.get(hubId);

        if (hubId && desiredRoomId === roomId) {
          this.switchClientToRoomForHubId(hubId);
        }

        console.log(`Matrix: joined room ${roomId}`);
      }
    });

    client.on("RoomState.events", ({ event }) => {
      if (event.type === "jel.hub") {
        this.hubIdToRoomId.set(event.content.hub_id, event.room_id);
        this.roomIdToHubId.set(event.room_id, event.content.hub_id);
      }

      if (event.type === "jel.space") {
        this.spaceIdToRoomId.set(event.content.space_id, event.room_id);
      }

      if (!client.isInitialSyncComplete()) return;

      // If a new room is added to a spaceroom we're in after initial sync,
      // we need to join it if it's auto_join.
      if (event.type === "m.space_child") {
        if (event.content.auto_join && event.content.via) {
          this._ensureRoomJoined(event.state_key);
        }
      }
    });
  }
}
