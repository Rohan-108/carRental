/**
 * @description Chat service
 */

angular.module("rentIT").factory("chatService", [
  "$http",
  "$q",
  "$rootScope",
  "BASE_URL",
  function ($http, $q, $rootScope, BASE_URL) {
    const BACKEND_URL = `${BASE_URL}`;
    const SOCKET_URL = BASE_URL.replace("/api/v1", "");
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    socket.on("connect_error", function (error) {
      console.error("Connection error:", error);
    });
    /**
     * @description fetch all chats for a conversation
     * @param {string} conversationId
     */
    function getAllChats(conversationId) {
      const deffered = $q.defer();
      $http
        .get(`${BACKEND_URL}/chats/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            deffered.resolve(response.data);
          },
          function errorCallback(error) {
            deffered.reject(error);
          }
        );
      return deffered.promise;
    }
    /**
     * @description fetch all conversations for a member
     * @param {string} memberId
     * @returns
     */
    function getAllConversation(memberId) {
      const deffered = $q.defer();
      $http
        .get(`${BACKEND_URL}/conversations/members/${memberId}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
        })
        .then(
          function successCallback(response) {
            deffered.resolve(response.data);
          },
          function errorCallback(error) {
            deffered.reject(error);
          }
        );
      return deffered.promise;
    }
    /**
     * @description send message to a conversation
     * @param {string} message
     * @param {string} conversationId
     */
    function sendMessage(message, conversationId) {
      const deffered = $q.defer();
      const data = {
        message,
        conversationId,
        sender: {
          _id: $rootScope.user._id,
          username: $rootScope.user.username,
          email: $rootScope.user.email,
          avatar: $rootScope.user.avatar,
        },
      };
      if (!socket.connected) {
        deffered.reject("Socket not connected");
        return deffered.promise;
      }
      socket.emit("sendMessage", data);
      deffered.resolve();
      return deffered.promise;
    }

    /**
     * @description join a conversation
     * @param {string} conversationId
     */
    function joinConversation(conversationId) {
      socket.emit("joinConversation", conversationId);
    }
    /**
     * @description leave a conversation
     * @param {string} conversationId
     */
    function leaveConversation(conversationId) {
      socket.emit("leaveConversation", conversationId);
    }
    /**
     * @description fetch conversation by car and member
     * @param {string} carId
     * @param {string} memberId
     * @returns
     */
    function getConversationByCarAndMember(carId, memberId) {
      const deffered = $q.defer();
      $http
        .get(
          `${BACKEND_URL}/conversations/?memberId=${memberId}&carId=${carId}`,
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
            cache: true,
          }
        )
        .then(
          function successCallback(response) {
            deffered.resolve(response.data);
          },
          function errorCallback(error) {
            deffered.reject(error);
          }
        );
      return deffered.promise;
    }

    /**
     * @description add conversation
     * @param {string} carId
     * @param {[string]} members
     */
    function addConversation(carId, members) {
      const deffered = $q.defer();
      $http
        .post(
          `${BACKEND_URL}/conversations`,
          { carId, members },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function successCallback(response) {
            deffered.resolve(response.data);
          },
          function errorCallback(error) {
            deffered.reject(error);
          }
        );
      return deffered.promise;
    }

    /**
     * @description upload attachment to a conversation by presigned url
     * @param {*} formdata
     * @param {*} key
     * @param {*} contentType
     * @param {*} conversationId
     */
    function uploadAttachment(formdata, key, contentType, conversationId) {
      const deffered = $q.defer();
      $http
        .get(
          `${BACKEND_URL}/conversations/signedUrl?key=${key}&contentType=${contentType}`,
          {
            headers: {
              "Content-Type": undefined,
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function successCallback(response) {
            const signedUrl = response.data.data.url;
            $http
              .put(`${signedUrl}`, formdata, {
                headers: {
                  "Content-Type": contentType,
                },
              })
              .then(
                function successCallback(response) {
                  const data = {
                    sender: {
                      _id: $rootScope.user._id,
                      username: $rootScope.user.username,
                      email: $rootScope.user.email,
                      avatar: $rootScope.user.avatar,
                    },
                    message: "",
                    attachment: {
                      name: key,
                      type: contentType,
                      refId: conversationId,
                    },
                    conversationId,
                  };
                  socket.emit("sendMessage", data);
                  return deffered.resolve(response);
                },
                function errorCallback(error) {
                  return deffered.reject(error);
                }
              );
          },
          function errorCallback(error) {
            return deffered.reject(error);
          }
        );
      return deffered.promise;
    }
    return {
      socket,
      sendMessage,
      joinConversation,
      leaveConversation,
      getAllChats,
      getAllConversation,
      getConversationByCarAndMember,
      addConversation,
      uploadAttachment,
    };
  },
]);
