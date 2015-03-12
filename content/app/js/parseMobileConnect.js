function ParseConnect() {
}
ParseConnect.prototype = {
    constructor: ParseConnect,
    /**************************************************************************************************
    general functions
    **************************************************************************************************/
    retrieve: function (type, typeToMatch, match, successCallback, errorCallback) {
        var pObject = Parse.Object.extend(type);
        var query = new Parse.Query(pObject);
        query.equalTo(typeToMatch, match);
        query.find().then( function (results){
                successCallback(results);
            },function (error) {
                errorCallback(error);
            });
    },
    update: function (type, typeToMatch, match, attToChange, newValue, successCallback, errorCallback) {
        var pObject = Parse.Object.extend(type);
        var query = new Parse.Query(pObject);
        query.equalTo(typeToMatch, match);
        query.find().then(function (toChange) {
            for (var i = 0; i < toChange.length; i++) {
                toChange[i].set(attToChange, newValue);
                toChange[i].save();
            }
            return toChange;
        }).then(function (toChange) { successCallback(toChange); },function (error) {
            errorCallback(error);
        });
    },
    loadData: function (myCallback) {
        var Customer = Parse.Object.extend("Customer");
        var query = new Parse.Query(Customer);
        query.include("vendor");
        query.get(mvpUI.activeUser.attributes.customer.id).then(function(result){
            myCallback(result);
        },function(error){
            myCallback(error);
        });
    },
    calculateSavings: function (customer,myCallback) {
        var redemption = Parse.Object.extend("RedemptionEvent");
        var query = new Parse.Query(redemption);
        query.equalTo("customer",customer);
        var savings = 0;
        query.each(function(redemption){
            if(redemption){
                savings = redemption.get("originalTotal")-redemption.get("newTotal");
            }
        }).then(function(res){
            myCallback(savings);
        },function(error){
            myCallback(error);
        });
    },
    /**************************************************************************************************
    user management functions
    **************************************************************************************************/
    addUser: function (userName, password, email, phone, type, entityID, myCallback) {
        userName = userName.toLowerCase();
        var UserSearch = Parse.Object.extend("User");
        var userQuery = new Parse.Query(UserSearch);
        userQuery.startsWith("username", userName);
        userQuery.find().then(function(exUsers){
            var suffix = "";
            if(exUsers && exUsers.length > 0){
                var sufInt = 0;
                for(var u = 0 ; u < exUsers.length ; u++){
                    var exEnd = exUsers[u].get("username");
                    exEnd = exEnd.replace(userName,"");
                    if(exEnd.length > 0 && parseInt(exEnd) >= sufInt){
                        sufInt = parseInt(exEnd);
                        suffix = (sufInt+1).toString();
                    }else if(sufInt < 1){
                        sufInt = 1;
                        suffix = "1";
                    }
                }
            }
            userName = userName+suffix;
            if(!email || email.length < 1){
                email = userName+ "@myvetperks.com";
            }
            
            var user = new Parse.User();
            user.set("username", userName);
            user.set("password", password);
            
            user.set("phone", phone);
            user.set("email", email);
    
            if (type == "customer") {
                //add customer user
                var Customer = Parse.Object.extend("Customer");
                var myCust = new Customer();
                myCust.id = entityID;
                user.set("customer", myCust);
                user.set("mvp", false);
                user.save(null,{
                    success: function (user) {
                        myCallback(user);
                    },
                    error: function (user, error) {
                        myCallback("Error: " + error.code + " " + error.message);
                    }
                });
            } else if (type == "vendor") {
                //add vendor user
                var Vendor = Parse.Object.extend("Vendor");
                var myVend = new Vendor();
                myVend.id = entityID;
                user.set("vendor", myVend);
                user.set("mvp", false);
                user.save(null,{
                    success: function (user) {
                        //add this user to the vendor role
                        var Role = new Parse.Object.extend("_Role");
                        var roleQuery = new Parse.Query(Role);
                        roleQuery.equalTo("name",myVend.id);
                        roleQuery.first({
                           success:function(role){
                            role.getUsers().add(user);
                            role.save(null,{
                           success:function(role){
                               myCallback(role);
                           }, 
                            error:function(role, error){
                                myCallback("Error assigning user role: " + error.code + " " + error.message);
                            }
                        });
                           }, 
                            error:function(role, error){
                                myCallback("Error assigning user role: " + error.code + " " + error.message);
                            }
                        });
                    },
                    error: function (user, error) {
                        myCallback("Error: " + error.code + " " + error.message);
                    }
                });
            }else{
                //add mvp user
                var Vendor = Parse.Object.extend("Vendor");
                var myVend = new Vendor();
                myVend.id = entityID;
                user.set("mvp", true);
                user.save(null,{
                    success: function (user) {
                        myCallback(user);
                    },
                    error: function (user, error) {
                        myCallback("Error: " + error.code + " " + error.message);
                    }
                });
            }
        },function (error) {
            myCallback("Error: " + error.code + " " + error.message);
        });
    },
    appLogIn: function (userName, password, myCallback) {
        Parse.Cloud.run('appLogin', { "username" : userName , "password" : password }, {
            success: function(token) {
                Parse.User.become(token).then(function (user) {
                  myCallback("success");
                }, function (error) {
                  myCallback("Error: " + error.code + " " + error.message);
                });
            },
            error: function(error) {
                myCallback(error.message);
            }
        });
    },
    tryPasswordReset: function (email, myCallback) {
        Parse.User.requestPasswordReset(email, {
            success: function () {
                myCallback("reset request sent to: " + email);
            },
            error: function (error) {
                myCallback("Error: " + error.code + " " + error.message);
            }
        });
    },
    deleteUser: function (userName, password, myCallback) {
        Parse.Cloud.run('deleteUser', { "username" : userName ,"password" : password }, {
          success: function(result) {
            myCallback(result);
          },
          error: function(error) {
            myCallback(error);
          }
        });
    },

    /**************************************************************************************************
    vet/vendor management functions
    **************************************************************************************************/
    retrieveVendor: function (type, typeToMatch, match, myCallback) {
        var retriever = this;
        function successCallBack(results) {
            var response = "Successfully retrieved " + results.length + " vendors.";
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                response += "<br><br>" + object.id + ' - name=' + object.get('name');
                response += "<br><br>" + object.id + ' - address=' + JSON.stringify(object.get('address'));
            }
            myCallback(response);
        }
        function errorCallBack(results) {
            myCallback("Error: " + results.code + " " + results.message);
        }
        retriever.retrieve(type, typeToMatch, match, successCallBack, errorCallBack);
    },
    /**************************************************************************************************
    customer management functions
    **************************************************************************************************/
    addCustomer: function (firstName, lastName, address, vendorId, cardNumber,phone, email, myCallback) {
        //get the vendor for this customer
        var Vend = Parse.Object.extend("Vendor");
        var refVend = new Vend();
        refVend.id = vendorId;
        var gifts = [];
        //check for active gifts for this vendor and add the items or packages to the new customer
        refVend.fetch().then(function(vend){
            var vendDeals = vend.get("activeDeals");
            for(d = 0 ; d < vendDeals.length ; d++){
                if(vendDeals[d].type == "item" && vendDeals[d].status == "available"){
                    gifts.push({
                        "count": 1,
                        "description": vendDeals[d].details.description,
                        "id": vendDeals[d].details.id,
                        "items": [
                          {
                            "description": vendDeals[d].details.description,
                            "id": vendDeals[d].details.id,
                            "name": vendDeals[d].details.items.name,
                            "value": vendDeals[d].details.items.maxValue
                          }
                        ],
                        "name": vendDeals[d].details.name
                    });
                }else if(vendDeals[d].type == "package" && vendDeals[d].status == "available"){
                    var items = [];
                    for(it = 0 ; it < vendDeals[d].details.items.length; it++){
                        items.push({
                            "description": vendDeals[d].details.description,
                            "id": vendDeals[d].details.id,
                            "name": vendDeals[d].details.items[it].name,
                            "value": vendDeals[d].details.items[it].maxValue
                        });
                    }
                    gifts.push({
                        "count": 1,
                        "description": vendDeals[d].details.description,
                        "id": vendDeals[d].details.id,
                        "items": items,
                        "name": vendDeals[d].details.name
                    });
                }
            }
            //return vend.save();
        }).then(function(results){
            //now create the new customer
            var cust = Parse.Object.extend("Customer");
            var newCust = new cust();
            newCust.set("firstName", firstName);
            newCust.set("lastName", lastName);
            newCust.set("address", address);
            newCust.set("phone", phone);
            newCust.set("email", email);
            newCust.set("cardNumber", cardNumber);
            newCust.set("vendor", refVend);
            newCust.set("subscriptionStatus", "inactive");
            newCust.set("points", 0);
            newCust.set("countProducts", []);
            newCust.set("gifts", gifts);
            var totalDate = new Date();
            newCust.set("subscriptionEnd", totalDate);
            
            //auto activate for cabarrus
            if(mvpLocation == "Cabarrus Animal Hospital"){
                totalDate.setDate(totalDate.getDate() + 365);
                newCust.set("subscriptionEnd", totalDate);
                newCust.set("subscriptionStatus", "active");
            }
            newCust.save(null, {
                success: function (newCust) {
                    //track cabarrus auto activation
                    if(mvpLocation == "Cabarrus Animal Hospital"){
                        //add vendor points for cabarrus
                        Parse.Cloud.run('updateVendorPoints', {
                        customer:newCust.id
                        });
                        
                        //track new customer for billing
                        var NCC = Parse.Object.extend("newCabarrus");
                        var ncc = new NCC();
                        ncc.set("customer", newCust.id);
                        ncc.set("name", newCust.get("firstName") + " " + newCust.get("lastName"));
                        ncc.save();
                    }
                    //add user profile for customer
                    ParseConnect.prototype.addUser(firstName+lastName,"password",email,phone,"customer",newCust.id,function(user){
                        if(typeof user == "string"){
                            myCallback(user);
                            newCust.destroy();
                        }else{
                            var newACL = new Parse.ACL();
                            newACL.setRoleWriteAccess(vendorId, true);
                            newACL.setRoleReadAccess(vendorId, true);
                            newACL.setPublicWriteAccess(false);
                            newACL.setPublicReadAccess(false);
                            newACL.setWriteAccess(user.id,true);
                            newACL.setReadAccess(user.id,true);
                            newCust.setACL(newACL);
                            newCust.save(null, {
                                success: function (newCust) {
                                    myCallback("success");//('New customer access set: ' + newCust.id);
                                },
                                error: function (newCust, error) {
                                    myCallback('Failed to assign new user to customer, with error code: ' + error.message);
                                }
                            });
                        }
                    });
                },
                error: function (newCust, error) {
                    myCallback('Failed to create new customer, with error code: ' + error.message);
                }
            });
        });
    },
    retrieveCustomer: function (type, typeToMatch, match, myCallback) {
        var retriever = this;
        function successCallBack(results) {
            var response = "Successfully retrieved " + results.length + " customers.";
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                response += "<br><br>" + object.id + ' - name=' + object.get('firstName');
                response += "<br><br>" + object.id + ' - location=' + JSON.stringify(object.get('address'));
            }
            myCallback(response);
        }
        function errorCallBack(results) {
            myCallback("Error: " + results.code + " " + results.message);
        }
        retriever.retrieve(type, typeToMatch, match, successCallBack, errorCallBack);
    },
    updateCustomer: function (type, typeToMatch, match, attToChange, newValue, myCallback) {
        var updater = this;
        function successCallBack(results) {
            var response = "Successfully updated " + results.length + " customers.";
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                response += "<br><br>" + object.id + ' - new name=' + object.get('firstName');
            }
            myCallback(response);
        }
        function errorCallBack(results) {
            myCallback("Error: " + results.code + " " + results.message);
        }
        updater.update(type, typeToMatch, match, attToChange, newValue, successCallBack, errorCallBack);
    },
    renewSubscription: function (type, typeToMatch, match, myCallback) {
        var pObject = Parse.Object.extend(type);
        var query = new Parse.Query(pObject);
        query.equalTo(typeToMatch, match);
        query.find().then(function (toChange) {
            for (var i = 0; i < toChange.length; i++) {
                var newDate = toChange[i].get("subscriptionEnd");
                var today = new Date();
                if(today > newDate){newDate = today;}
                newDate.setDate(newDate.getDate() + 365);
                toChange[i].set("subscriptionEnd", newDate);
                toChange[i].save();
            }
            return "subscription extended to: " + newDate.getDate();
        }).then(function (toChange) { myCallback(toChange); }, function (error) {
            myCallback('Failed to extend subscription, with error code: ' + error.message);
        });
    },
    cancelSubscription: function (type, typeToMatch, match, myCallback) {
        var pObject = Parse.Object.extend(type);
        var query = new Parse.Query(pObject);
        query.equalTo(typeToMatch, match);
        query.find().then(function (toChange) {
            for (var i = 0; i < toChange.length; i++) {
                var newDate = new Date();
                newDate.setDate(newDate.getDate() - 1);
                toChange[i].set("subscriptionEnd", newDate);
                toChange[i].save();
            }
            return "subscription ended (set to: " + newDate.getDate() + ")";
        }).then(function (toChange) { myCallback(toChange); }, function (error) {
            myCallback('Failed to end subscription, with error code: ' + error.message);
        });
    },
    getCustomerCardNumber: function (firstName, lastName, myCallback) {
        var pObject = Parse.Object.extend("Customer");
        var query = new Parse.Query(pObject);
        query.equalTo("firstName", firstName);
        query.equalTo("lastName", lastName);
        query.find().then(
            function (results) {
                var response = "Successfully retrieved " + results.length + " customers.";
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    response += "<br><br>" + object.id + ' - card number=' + object.get('cardNumber');
                }
                myCallback(response);
            }, function (error) {
                myCallback("Error: " + error.code + " " + error.message);
        });
    },
    getCustomerDeals: function (firstName, lastName, myCallback) {
        var pObject = Parse.Object.extend("Customer");
        var query = new Parse.Query(pObject);
        query.equalTo("firstName", firstName);
        query.equalTo("lastName", lastName);
        query.find().then(
            function (results) {
                var response = new Array();
                for (var i = 0; i < results.length; i++) {
                    var object = { "firstName": results[i].get('firstName'), "lastName": results[i].get('lastName'), "activeDeals": results[i].get('activeDeals') };
                    response.push(object);
                }
                myCallback(JSON.stringify(response));
            }, function (error) {
                myCallback("Error: " + error.code + " " + error.message);
            });
    },
    /**************************************************************************************************
    cloud functions
    **************************************************************************************************/
    //testing calling cloud functions
    emailTest: function () {
        Parse.Cloud.run('sendMail', {address:"",subject:"",body:""}, {
            success: function (result) {
                alert(result);
            },
            error: function (error) {
                alert(result);
            }
        });
    },
    emailCustomer: function (customerId,emailSubject,emailBody) {
        var Customer = Parse.Object.extend("Customer");
        var custQuery = new Parse.Query(Customer);
        custQuery.get(customerId,{
            success: function (userObject) {
                var emailAddress = userObject.get("email");
                Parse.Cloud.run('sendMail', { address: emailAddress, subject: emailSubject, body: emailBody }, {
                    success: function (result) {
                        //alert(result);
                    },
                    error: function (error) {
                        alert(result);
                    }
                });
            }, error: function (userObject, error) {
                alert(error);
            }
        });
    },
    emailVendor: function (vendorId, emailSubject, emailBody) {
        var Vendor = Parse.Object.extend("Vendor");
        var vendorQuery = new Parse.Query(Vendor);
        vendorQuery.get(vendorId,{
            success: function (vendorObject) {
                var emailAddress = vendorObject.get("contact").Email;
                Parse.Cloud.run('sendMail', { address: emailAddress, subject: emailSubject, body: emailBody }, {
                    success: function (result) {
                        //alert(result);
                    },
                    error: function (error) {
                        alert(error);
                    }
                });
            }, error: function (userObject, error) {
                alert(error);
            }
        });
    },
    /**************************************************************************************************
    setting up roles and security
    **************************************************************************************************/
    roleHierarchy: function (subRole,masterRole,myCallback) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", subRole);
        var superRole;
        roleQuery.first().then(function (result) {
            superRole = result;
            var newRoleQuery = new Parse.Query(Parse.Role);
            newRoleQuery.equalTo("name", masterRole);
            return newRoleQuery.first();
        }).then(function (result){
            superRole.getRoles().add(result);
            return superRole.save();
        }).then(function (result) {
            myCallback(result);
        }, function (error,result) {
            myCallback("Error: " + error.code + " " + error.message);
        });
    },    
    removeRoleHierarchy: function (master,sub,myCallback) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", master);
        var superRole;
        roleQuery.first().then(function (result) {
            superRole = result;
            var newRoleQuery = new Parse.Query(Parse.Role);
            newRoleQuery.equalTo("name", sub);
            return newRoleQuery.first();
        }).then(function (result){
            superRole.getRoles().remove(result);
            return superRole.save();
        }).then(function (result) {
            myCallback(result);
        }, function (error,result) {
            myCallback("Error: " + error.code + " " + error.message);
        });
    },
    addRole: function (name,myCallback) {
        // By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
        var roleACL = new Parse.ACL();
        roleACL.setPublicReadAccess(true);
        roleACL.setPublicWriteAccess(true);
        var role = new Parse.Role(name, roleACL);
        role.save(null,{
            success:function(role){
                ParseConnect.prototype.roleHierarchy(name,"Administrator",function(){
                   ParseConnect.prototype.roleHierarchy(name,"XnKMEBvccF",function(){
                        var roleACL = new Parse.ACL();
                        roleACL.setPublicReadAccess(false);
                        roleACL.setPublicWriteAccess(false);
                        roleACL.setRoleReadAccess(name,true);
                        roleACL.setRoleWriteAccess(name,true);
                        role.setACL(roleACL);
                        role.save(null,{
                            success:function(role){
                                myCallback("added role");
                            },
                            error:function(role, error){
                                myCallback("Error: " + error.code + " " + error.message);
                            }
                        });
                    });
                });
            },
            error:function(role, error){
                myCallback("Error: " + error.code + " " + error.message);
            }
        });
    },
    updateVendorRoles: function (vendorId) {
        ParseConnect.prototype.addRole(vendorId,function(response){
            if(typeof response == "string"){
                alert(response);
            }else{    
                ParseConnect.prototype.addUsersToRole(vendorId,function(response){alert(response);});
            }
        });
    },    
    lockRoleACL: function (name) {
        // By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", name);
        roleQuery.first().then(function (result) {
            var roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            roleACL.setPublicWriteAccess(false);
            result.set("ACL", roleACL);
            return result.save();
        }).then(function (result) {
            alert("success");
        }, function (error) {
            alert(error);
        });
    },
    addUsersToRole: function (vendorId,myCallback) {
        //add vendor user
        var Vendor = Parse.Object.extend("Vendor");
        var myVend = new Vendor();
        myVend.id = vendorId;

        var Role = new Parse.Object.extend("_Role");
        var roleQuery = new Parse.Query(Role);
        roleQuery.equalTo("name",myVend.id);
        roleQuery.find({
           success:function(roles){
            var User = Parse.Object.extend("User");
            var userQuery = new Parse.Query(User);
            userQuery.equalTo("vendor",myVend);
            userQuery.find({                   
                success:function(users){
                    if(users.length > 0){
                    for(var i = 0 ; i < users.length ; i++){
                       roles[0].getUsers().add(users[i]); 
                    }
                    roles[0].save(null,{
                       success:function(role){
                           myCallback(role);
                       }, 
                        error:function(role, error){
                            myCallback("Error assigning user role: " + error.code + " " + error.message);
                        }
                    });
                    }else{
                        myCallback("No Users setup for this vendor.");
                    }
                }, 
                error:function(users, error){
                    myCallback("No Users found for this vendor: " + error.code + " " + error.message);
                }
            });
           }, 
            error:function(roles, error){
                myCallback("Error assigning user role: " + error.code + " " + error.message);
            }
        });
    },
    setUserRole: function (userName,roleName) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", roleName);
        var superRole;
        roleQuery.first().then(function (result) {
            superRole = result;
            var userQuery = new Parse.Query(Parse.User);
            userQuery.equalTo("username", userName);
            return userQuery.first();
        }).then(function (result) {
            superRole.getUsers().add(result);
            return superRole.save();
        }).then(function (result) {
            alert("success");
        }, function (error) {
            alert(error);
        });
    },
    setObjectRole: function (objectName, objectId, roleName, yesNo,myCallback) {
        var status = "";
        var accessObject = Parse.Object.extend(objectName);
        var accessQuery = new Parse.Query(accessObject);
        var newACL = new Parse.ACL();
        newACL.setRoleWriteAccess(roleName, yesNo);
        newACL.setRoleReadAccess(roleName, yesNo);
        accessQuery.get(objectId).then(function (results) {
                results.setACL(newACL);
                results.save();
        }).then(function (result) {
            myCallback("success");
        }, function (error) {
            myCallback(error);
        });
    }
}