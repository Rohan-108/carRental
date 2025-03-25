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
  "chatService",
  "toaster",
  "$q",
  "$timeout",
  function ($scope, $rootScope, chatService, toaster, $q, $timeout) {
    // Initialize variables
    $scope.messages = []; // to hold the messages
    $scope.message = ""; // to hold the message
    $scope.convId = null; // current conversation id
    $scope.conversations = []; // to hold the conversations
    $scope.imageModal = false; // to toggle the image modal
    $scope.image = null; // to hold the image

    /**
     * @description load the sidebar with all the conversations
     */
    $scope.init = function () {
      $scope.loadSidebar();
      $scope.listenToMessageEvent();
    };

    $scope.listenToMessageEvent = function () {
      chatService.socket.on("newMessage", (data) => {
        $timeout(() => {
          $scope.messages.push(data);
        });
      });
    };

    /**
     * @description load the sidebar with all the conversations
     */
    $scope.loadSidebar = function () {
      chatService
        .getAllConversation($rootScope.user._id)
        .then((response) => {
          const convs = response.data.map((conv) => {
            conv.members = conv.members.filter(
              (member) => member._id !== $rootScope.user._id
            );
            return conv;
          });
          $scope.conversations = convs;
        })
        .catch((error) => {
          toaster.pop("error", "Error", "Error while fetching conversations");
        });
    };

    /**
     * @description change the chat based on the conversation
     * @param {*} convId - conversation id
     */
    $scope.changeChat = function (convId) {
      chatService.leaveConversation($scope.convId);
      $scope.convId = convId;
      $scope.loadUserChat();
      chatService.joinConversation(convId);
    };

    /**
     * @description load the chat based on the conversation id
     */
    $scope.loadUserChat = function () {
      if ($scope.convId === null) {
        toaster.pop("error", "Error", "Please select a conversation");
        return;
      }
      chatService
        .getAllChats($scope.convId)
        .then((response) => {
          $scope.messages = response.data.chats;
        })
        .catch((error) => {
          toaster.pop("error", "Error", "Error while fetching chats");
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
      chatService
        .sendMessage($scope.message, $scope.convId)
        .then(() => {
          $scope.message = "";
        })
        .catch((error) => {
          toaster.pop("error", "Error", "Error while sending message");
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
      const key = $scope.image.name + "-" + Date.now();
      const contentType = $scope.image.type;
      chatService
        .uploadAttachment($scope.image, key, contentType, $scope.convId)
        .then((response) => {
          toaster.pop("success", "Success", "Image uploaded successfully");
          $scope.toggleModal(false);
          $scope.image = null;
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error?.message || "Error while uploading image"
          );
        });
    };
  },
]);
