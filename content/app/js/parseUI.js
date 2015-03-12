function MVPUI() {
}
MVPUI.prototype = {
  constructor: MVPUI,
  app:new Framework7(),
  activeUser:null,
  userData:null,
  fnInitializeScreens: function(){
    // Export selectors engine
    $$ = Dom7;
    //connected to dev server
    appId = "Lf7TQ7BXpyyYTYAh5fNemLTyn2cCKQ2T8DoHgI9a";
    jKey = "W2Xio1MH57kZX6eHyJ6EIgap8aNS0XhF2UpaIK8f";    
    //connect to parse
    console.log( "loaded" );
    Parse.initialize(appId, jKey);
    console.log( "parse connection initialized" );
    
    //set global location data
    mvpLocation = "mvp";
    mvpLocationData = null;
    
    ////load location data and add event handlers
    MVPUI.prototype.fnLoadWithLocationData();
    MVPUI.prototype.fnAddEventHandlers();
  },
  fnLoadWithLocationData: function(){
    MVPUI.prototype.activeUser = Parse.User.current();
    if(MVPUI.prototype.activeUser != null){
      MVPUI.prototype.activeUser.fetch().then(function(theuser){
        pCon.loadData(function(res){
          if(res.message){
            alert(res.message);
          }else{
             MVPUI.prototype.userData = res;
             
            //Add views
            var view1 = MVPUI.prototype.app.addView('#view-1');
            var view2 = MVPUI.prototype.app.addView('#view-2', {
                // Because we use fixed-through navbar we can enable dynamic navbar
                dynamicNavbar: true
            });
            var view3 = MVPUI.prototype.app.addView('#view-3');
            var view4 = MVPUI.prototype.app.addView('#view-4');
            var view4 = MVPUI.prototype.app.addView('#view-4');
            
            MVPUI.prototype.fnUpdateView();
            $$(".splash").hide();
          }
        });
      });
    }else{
      MVPUI.prototype.app.loginScreen();
    }
  },
  fnUpdateView: function(){
    pCon.calculateSavings(MVPUI.prototype.userData,MVPUI.prototype.fnSetSavings);
    
    $$(".vet_name").text(MVPUI.prototype.userData.get("vendor").get("name"));
    $$(".point-total").text(MVPUI.prototype.userData.get("points"));
    
    
    $$(".your_vet").val(MVPUI.prototype.userData.get("vendor").get("name"));
    $$(".your_vet_url").val("www.mvp.vet/at/"+MVPUI.prototype.userData.get("vendor").get("name").toLowerCase().replace(" ",""));
    $$(".your_name").val(MVPUI.prototype.userData.get("firstName")+" "+MVPUI.prototype.userData.get("lastName"));
    $$(".your_phone").val(MVPUI.prototype.userData.get("phone"));
    $$(".your_membership").val(MVPUI.prototype.userData.get("subscriptionStatus"));
    $$(".your_email").val(MVPUI.prototype.activeUser.get("email"));
    
    $$(".logo_image").attr("src","https://i.embed.ly/1/display/resize?url="+MVPUI.prototype.userData.get("vendor").get("logo").url()+"&key=b4b59d4802eb44b487eae8132351a634&width=150&height=150");
  },
  fnSetSavings: function(savings){
    if(savings.message){
      mvpUI.app.alert(savings.message);
    }else{
      $$(".savings-total").text("$" + parseFloat(Math.round(savings * 100) / 100).toFixed(2));
    }
  },
  fnGetLoginUser: function () {
    var username = "";
    var password = "";
    username = $$('.login-screen').find('input[name="username"]').val();
    password = $$('.login-screen').find('input[name="password"]').val();
    MVPUI.prototype.fnLoginUser(username,password);
  },
  fnLoginUser: function (username,password) {
    if(username.length > 0 && password.length > 0){
      pCon.appLogIn(username, password, function(res){
        if(res == "success"){
          $$(".splash").hide();
          mvpUI.activeUser = Parse.User.current();
          $$('.login-screen').find('input[name="username"]').val("");
          $$('.login-screen').find('input[name="password"]').val("");
          mvpUI.app.alert('User: ' + mvpUI.activeUser.id, function () {
              mvpUI.app.closeModal('.login-screen');
              MVPUI.prototype.fnLoadWithLocationData();
          });
        }else{
          $$('.login-screen').find('input[name="username"]').val("");
          $$('.login-screen').find('input[name="password"]').val("");
          mvpUI.app.alert(res);
        }
      });
    }
  },
  fnLogout: function () {
    $$(".splash").show();
    Parse.User.logOut();
    MVPUI.prototype.fnLoadWithLocationData();
  },
  fnSaveCustomerChanges: function(destination){
    var address = {
      address:"",
      city:"",
      state:"",
      zip:""
    }
    address.address = $$("#mvpNewAddress").val();
    address.city = $$("#mvpNewCity").val();
    address.state = $$("#mvpNewState").val();
    address.zip = $$("#mvpNewZip").val();
    
    var editCustomers = Parse.Object.extend("Customer");
    if(mvpLocationData.selected.length > 1){
    MVPUI.prototype.fnModalStart("saving customer edits");
    var query = new Parse.Query(editCustomers);
    query.get(mvpLocationData.selected,{
      success:function(customer){
        customer.set("email",$(".mvpCustomerEmail").val());
        customer.set("phone",$(".mvpCustomerPhone").val());
        customer.set("points",parseInt($(".mvpCustomerPoints").val()));
        customer.set("cardNumber",$(".mvpCustomerCardNumber").val());
        customer.set("firstName",$(".mvpCustomerFirstName").val());
        customer.set("lastName",$(".mvpCustomerLastName").val());
        customer.set("address",address);
        customer.save(null,{
           success: function(result) {
              MVPUI.prototype.fnModalEnd();
              MVPUI.prototype.fnGoToSettings("customer");
            },
            error: function(result, error) {
              MVPUI.prototype.fnModalEnd();
              alert(error.message);
            }
        });
    },
    error:function(result, error){
      MVPUI.prototype.fnModalEnd();
      alert(error.message);
    }
    });
    }else{
      var customer = new editCustomers();
      MVPUI.prototype.fnModalStart("saving new customer");
      pCon.addCustomer(
        $$(".mvpCustomerFirstName").val(), 
        $$(".mvpCustomerLastName").val(), 
        address, 
        mvpLocationData.id, 
        $$(".mvpCustomerCardNumber").val(), 
        $$(".mvpCustomerPhone").val(),
        $$(".mvpCustomerEmail").val(),
        function(result) {
          MVPUI.prototype.fnModalEnd();
          if(result == "success"){
            pCon.cardSwipe($(".mvpCustomerCardNumber").val(), mvpUI.activeUser,"newCustomer", function(){});//recording swipe event for new customer
            MVPUI.prototype.fnGoToSettings("customer");
          }else{
            alert(result);
          }
        });
    }
  },
  fnResetPassword: function () {
    var resetEmail = $$("#mvpResetEmail").val();
    pCon.tryPasswordReset(resetEmail, function(message){
      alert(message);
      location.reload();
    });
  },
  fnCheckUser: function () {
    pCon.checkLogin(function(message){alert(message);});
  },
  fnChangePassword: function () {
    var enteredPassword = $$("#old-password").val();
    var newPassword = $$("#password").val();
    var confirmPassword = $$("#password2").val();
    var username = mvpUI.activeUser.get("username");
    Parse.User.logIn(username, enteredPassword, {
      success: function (user) {
        if(newPassword == confirmPassword && newPassword.length > 4 && confirmPassword.length > 4){
          user.set("password",newPassword);
          user.save().then(
            function(user) {
              return user.fetch();
            }
          ).
          then(
            function(user){
              mvpUI.activeUser = user;
              if(mvpLocationData.selected == mvpUI.activeUser.id){
                MVPUI.prototype.fnGoToSwipe();
              }else{
                MVPUI.prototype.fnGoToSettings("user");
              }
              mvpLocationData.selected = "";
            },
            function(error){
              $$("#old-password").val("");$$("#password").val("");$$("#password2").val("");
              alert("Error: " + error.code + " " + error.message);
            });
        }else{
        $$("#old-password").val("");$$("#password").val("");$$("#password2").val("");
        alert("password confirmation did not match or password is shorter than 5 characters"); 
        }
      },
      error: function (user, error) {
        $("#old-password").val("");$$("#password").val("");$$("#password2").val("");
        alert("existing password did not match"); 
      }
    });
  },
  fnAddEventHandlers:function (){
      //login to app
    $$('.login-screen').find('.sign-in').on('click', mvpUI.fnGetLoginUser);
    //create a new user/customer
    $$('.login-screen').find('.send-sign-up').on('click', function () {
        var username = $$('.login-screen').find('input[name="username"]').val();
        var password = $$('.login-screen').find('input[name="password"]').val();
        mvpUI.app.alert('Username: ' + username + ', password: ' + password, function () {
            mvpUI.app.closeModal('.login-screen');
        });
    });
    //goto create screen
    $$('.login-screen').find('.create-profile').on('click', function () {
        $$('.identity').append('<li class="item-content id-repeatPassword">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Repeat Password</div>'+
                            '    <div class="item-input">'+
                            '      <input type="password" name="repeatPassword" placeholder="Your password">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-email">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Email</div>'+
                            '    <div class="item-input">'+
                            '      <input type="email" name="email" placeholder="Your email">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-firstName">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">First Name</div>'+
                            '    <div class="item-input">'+
                            '      <input type="text" name="firstName" placeholder="first name">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-lastName">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Last Name</div>'+
                            '    <div class="item-input">'+
                            '      <input type="text" name="lastName" placeholder="last name">'+
                            '    </div>'+
                            '  </div>');
        $$('.log-in').show();$$('.send-sign-up').show();
        $$('.create-profile').hide();$$('.sign-in').hide();
    });
    //goto login
    $$('.login-screen').find('.log-in').on('click', function () {
        $$('.log-in').hide();$$('.send-sign-up').hide();
        $$('.create-profile').show();$$('.sign-in').show();
        $$('.login-screen').find('.id-firstName').remove();
        $$('.login-screen').find('.id-lastName').remove();
        $$('.login-screen').find('.id-email').remove();
        $$('.login-screen').find('.id-repeatPassword').remove();
    });
    //logout
    $$('.tabbar-labels').find('.open-login-screen').on('click', mvpUI.fnLogout);
  }
}