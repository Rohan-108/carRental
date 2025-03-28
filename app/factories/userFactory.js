/**
 * @description User Factory
 * @name userFactory
 * @requires $q
 * @requires userService
 * @requires sessionService
 * @requires $rootScope
 */
angular.module("rentIT").factory("userFactory", [
  "$q",
  "userService",
  "sessionService",
  "$rootScope",
  function ($q, userService, sessionService, $rootScope) {
    class User {
      constructor(user) {
        this.email = user?.email;
        this.password = user?.password;
        this.role = user?.role || "user";
        this.avatar = user?.avatar;
        this.tel = user?.tel;
        this.adhaar = user?.adhaar;
        this.username = user?.username;
        this.accessToken = user?.accessToken;
      }
      /**
       * @description Login the user
       */
      login() {
        //validate the email and password
        if (!this.email || !this.password) {
          return $q.reject({ description: "Invalid email or password." });
        }
        const deferred = $q.defer();
        userService
          .login(this.email, this.password)
          .then((response) => {
            const user = response.data.user;
            const accessToken = response.data.accessToken;
            sessionService.setUser({ ...user, accessToken });
            deferred.resolve();
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }
      /**
       * @description Register the user
       */
      register() {
        //validate the user data
        if (
          !this.email ||
          !this.password ||
          !this.username ||
          !this.tel ||
          !this.adhaar ||
          !this.avatar
        ) {
          return $q.reject({ description: "Invalid user data." });
        }
        const formData = new FormData();
        formData.append("username", this.username);
        formData.append("email", this.email);
        formData.append("password", this.password);
        formData.append("avatar", this.avatar);
        formData.append("role", this.role);
        formData.append("adhaar", this.adhaar);
        formData.append("tel", this.tel);
        const deferred = $q.defer();
        userService
          .addUser(formData)
          .then((response) => {
            const user = response.data.user;
            const accessToken = response.data.accessToken;
            sessionService.setUser({ ...user, accessToken });
            deferred.resolve();
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }
      /**
       * @description Change the password of the user
       * @param {*} oldPassword
       * @param {*} newPassword
       * @param {*} confirmPassword
       */
      changePassword(oldPassword, newPassword, confirmPassword) {
        const deferred = $q.defer();
        if (!oldPassword || !newPassword || !confirmPassword) {
          deferred.reject({ description: "Invalid data." });
        } else {
          //validate the passwords
          if (oldPassword === newPassword) {
            deferred.reject({
              description:
                "New password should be different from old password.",
            });
          } else if (newPassword !== confirmPassword) {
            deferred.reject({
              description:
                "New password and confirm password should be the same.",
            });
          } else {
            userService
              .changePassword(oldPassword, newPassword)
              .then((response) => {
                deferred.resolve();
              })
              .catch((error) => {
                deferred.reject(error);
              });
          }
        }
        return deferred.promise;
      }
      /**
       * @description Update the user data
       * @param {*} data - The user data to update
       */
      updateUser(data) {
        const deferred = $q.defer();
        const formData = new FormData();
        for (const key in data) {
          formData.append(key, data[key]);
        }
        userService
          .updateUser(formData)
          .then((response) => {
            const newUser = {
              ...response.data.user,
              accessToken: sessionService.getUser().accessToken,
            };
            sessionService.setUser(newUser);
            $rootScope.user = newUser;
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    }
    return {
      createUser: function (user) {
        return new User(user);
      },
    };
  },
]);
