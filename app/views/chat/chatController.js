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
 * @requires $uibModal
 */
angular.module("rentIT").controller("chatController", [
  "$scope",
  "$rootScope",
  "chatService",
  "toaster",
  "$q",
  "$timeout",
  "$uibModal",
  function ($scope, $rootScope, chatService, toaster, $q, $timeout, $uibModal) {
    // Initialize variables
    $scope.messages = []; // to hold the messages
    $scope.message = ""; // to hold the message
    $scope.convId = null; // current conversation id
    $scope.conversations = []; // to hold the conversations
    $scope.image = null; // to hold the image
    $scope.modalInstance = null; // to hold modal instance reference

    // For backward compatibility
    $scope.imageModal = false;

    /**
     * @description load the sidebar with all the conversations
     */
    $scope.init = function () {
      $scope.loadSidebar();
      $scope.listenToMessageEvent();
    };

    /**
     * @description Helper function to scroll to the bottom of the chat
     */
    $scope.scrollToBottom = function () {
      $timeout(function () {
        const messageBox = document.getElementById("messageBox");
        if (messageBox) {
          messageBox.scrollTop = messageBox.scrollHeight;
        }
      }, 100); // Small delay to ensure DOM is updated
    };

    $scope.listenToMessageEvent = function () {
      chatService.socket.on("newMessage", (data) => {
        $timeout(() => {
          $scope.messages.push(data);
          // Scroll to bottom when new message arrives
          $scope.scrollToBottom();
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
          // Scroll to bottom when conversation is changed
          $scope.scrollToBottom();
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
          // Scroll to bottom after sending a message (in case socket is slow)
          $scope.scrollToBottom();
        })
        .catch((error) => {
          toaster.pop("error", "Error", "Error while sending message");
        });
    };

    /**
     * @description Open the image upload modal using Angular UI Bootstrap
     */
    $scope.openImageModal = function () {
      const convId = $scope.convId;
      $scope.modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "imageModalContent.html",
        backdrop: "static",
        keyboard: false,
        controller: function ($scope, $uibModalInstance) {
          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };

          $scope.uploadImage = function () {
            if ($scope.$parent.image === null) {
              toaster.pop("error", "Error", "Please select an image");
              return;
            }
            if (!convId) {
              toaster.pop(
                "error",
                "Error",
                "Please create a conversation first"
              );
              return;
            }
            const key = $scope.$parent.image.name + "-" + Date.now();
            const contentType = $scope.$parent.image.type;
            chatService
              .uploadAttachment($scope.$parent.image, key, contentType, convId)
              .then((response) => {
                toaster.pop(
                  "success",
                  "Success",
                  "Image uploaded successfully"
                );
                $uibModalInstance.close();
                $scope.$parent.image = null;
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
      });

      // Set state flag for backward compatibility
      $scope.imageModal = true;

      // Handle both resolution and rejection of modal promise
      $scope.modalInstance.result
        .then(
          function (result) {
            // Handle close (success)
            console.log("Modal closed with result:", result);
          },
          function (reason) {
            // Handle dismiss (cancel)
            console.log("Modal dismissed with reason:", reason);
          }
        )
        .finally(function () {
          // Reset state regardless of how the modal closed
          $scope.imageModal = false;
          $scope.modalInstance = null;
        });
    };

    /**
     * @description For backward compatibility with old modal implementation
     * @param {*} state - state of the modal
     */
    $scope.toggleModal = function (state) {
      if (state) {
        $scope.openImageModal();
      } else if ($scope.modalInstance) {
        $scope.modalInstance.dismiss("cancel");
        $scope.modalInstance = null;
      }
      $scope.imageModal = state;
      $scope.image = null;
    };
  },
]);
