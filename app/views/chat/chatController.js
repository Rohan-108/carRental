/**
 * @description Controller for chat module
 * @name chatController
 * @requires $scope
 * @requires $rootScope
 * @requires userService
 * @requires utilService
 * @requires chatService
 * @requires toaster
 * @requires $q
 */
angular.module("rentIT").controller("chatController", [
  "$scope",
  "$rootScope",
  "userService",
  "utilService",
  "chatService",
  "toaster",
  "$q",
  function (
    $scope,
    $rootScope,
    userService,
    utilService,
    chatService,
    toaster,
    $q
  ) {
    // Initialize variables
    $scope.messages = []; // to hold the messages
    $scope.message = ""; // to hold the message
    $scope.convId = null; // current conversation id
    $scope.conversations = []; // to hold the conversations
    $scope.user = {}; // to hold the user (needed for showing his avatar)
    $scope.imageModal = false; // to toggle the image modal
    $scope.image = null; // to hold the image

    /**
     * @description load the sidebar with all the conversations
     */
    $scope.init = function () {
      $scope.loadSidebar();
    };

    /**
     * @description load the sidebar with all the conversations
     */
    $scope.loadSidebar = function () {
      $q.when(userService.getUserById($rootScope.user.id))
        .then((user) => {
          return $q.when(chatService.getAllConversations()).then((allconv) => {
            const myconversations = allconv.filter((conv) => {
              let isMember = false;
              for (const member of conv.members) {
                if (member.id === user.id) {
                  isMember = true;
                  break;
                }
              }
              return isMember;
            });
            const modifiedConversations = myconversations.map((conv) => {
              const otherMember = conv.members.find(
                (member) => member.id !== user.id
              );
              const imgUrl = URL.createObjectURL(
                new Blob([otherMember.avatar])
              );
              return Object.assign({}, conv, { otherMember, imgUrl });
            });
            $scope.conversations = modifiedConversations;
            $scope.user = user;
          });
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while fetching conversations");
        });
    };

    /**
     * @description change the chat based on the conversation
     * @param {*} convId - conversation id
     */
    $scope.changeChat = function (convId) {
      $scope.convId = convId;
      $scope.loadUserChat();
    };

    /**
     * @description load the chat based on the conversation id
     */
    $scope.loadUserChat = function () {
      if ($scope.convId === null) {
        toaster.pop("error", "Error", "Please select a conversation");
        return;
      }
      $q.when(chatService.getChatsByConversationId($scope.convId))
        .then((myChat) => {
          myChat.sort((a, b) => a.createdAt - b.createdAt);
          return myChat.map((chat) => {
            if (chat.image) {
              chat.image = URL.createObjectURL(new Blob([chat.image]));
            }
            chat.user.avatar = URL.createObjectURL(
              new Blob([chat.user.avatar])
            );
            return chat;
          });
        })
        .then((updatedChat) => {
          $scope.messages = updatedChat;
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while fetching chat messages");
        });
    };

    /**
     * @description send the chat message to the selected conversation
     */
    $scope.sendChat = function () {
      if ($scope.message.trim() === "") {
        toaster.pop("error", "Error", "Please enter a message");
        return;
      }
      $q.when(
        chatService.addChat({
          id: "",
          conversationId: $scope.convId,
          sender: $rootScope.user.id,
          user: $scope.user,
          message: $scope.message,
          image: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )
        .then(() => {
          $scope.loadUserChat();
          $scope.message = "";
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.message || "Error while sending message"
          );
        });
    };

    /**
     * @description toggle the image modal
     * @param {*} state - state of the modal
     */
    $scope.toggleModal = function (state) {
      $scope.imageModal = state;
      $scope.image = null;
    };
    /**
     * @description upload the image to the selected conversation
     */
    $scope.uploadImage = function () {
      if ($scope.image === null) {
        toaster.pop("error", "Error", "Please select an image");
        return;
      }
      $q.when(utilService.toArrayBuffer([$scope.image]))
        .then((image) => {
          return chatService.addChat({
            id: "",
            conversationId: $scope.convId,
            sender: $scope.user.id,
            message: "",
            user: $scope.user,
            image: image,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        })
        .then(() => {
          $scope.toggleModal(false);
          $scope.loadUserChat();
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.message || "Error while uploading image"
          );
        });
    };
  },
]);
