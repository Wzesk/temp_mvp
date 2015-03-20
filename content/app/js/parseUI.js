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
            MVPUI.prototype.app.alert(res.message,"");
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
    
    $$(".vet_name").text(MVPUI.prototype.userData.pvendor.get("name"));
    $$(".point-total").text(MVPUI.prototype.userData.get("points"));
    
    
    $$(".your_vet").val(MVPUI.prototype.userData.pvendor.get("name"));
    $$(".your_vet_url").val("www.mvp.vet/at/"+MVPUI.prototype.userData.pvendor.get("name").toLowerCase().replace(" ",""));
    $$(".your_name").val(MVPUI.prototype.userData.get("firstName")+" "+MVPUI.prototype.userData.get("lastName"));
    $$(".your_phone").val(MVPUI.prototype.userData.get("phone"));
    $$(".your_membership").val(MVPUI.prototype.userData.get("subscriptionStatus"));
    $$(".your_email").val(MVPUI.prototype.activeUser.get("email"));
    
    var vEmail = MVPUI.prototype.userData.pvendor.get("contact").Email;
    if(!vEmail){vEmail = "info@myvetperks.com";}
    $$(".emailVet").attr("href","mailTo:"+vEmail);
    var phone = MVPUI.prototype.userData.pvendor.get("contact").BusinessPhone;
    if(!phone || phone.length < 7){
      phone = MVPUI.prototype.userData.pvendor.get("contact").CellPhone;
    }
    if(!phone){
      phone = 1111111111;
    }
    phone = phone.replace("(","").replace(")","").replace("-","").replace(".","").replace(" ","");
    $$(".callVet").attr("href","tel:"+phone);
    
    $$(".logo_image").attr("src","https://i.embed.ly/1/display/resize?url="+MVPUI.prototype.userData.pvendor.get("logo").url()+"&key=b4b59d4802eb44b487eae8132351a634&width=150&height=150");
  
    //update free items and count items
    var freebies = MVPUI.prototype.userData.get("gifts");
    for(var g = 0 ; g < freebies.length ; g++){
      MVPUI.prototype.fnAddFree(freebies[g]);
    }
    var counts = MVPUI.prototype.userData.get("countProducts");
    for(var c = 0 ; c < counts.length ; c++){
      MVPUI.prototype.fnAddCount(counts[c]);
    }
  },
  fnAddFree: function(free){
    var added = '<li class="item-content">'+
                '  <div class="item-media">'+
                '    <i class="fa fa-paw fa-lg"></i>'+
                '  </div>'+
                '  <div class="item-inner">'+
                '    <div class="item-title-row">'+
                '      <div class="item-title">'+free.count+' '+free.name+'</div>'+
                '    </div>'+
                '    <div class="item-subtitle">'+free.description+'</div>'+
                '  </div>'+
                '</li>';    
    $$(".free_item_list").append(added);
  },
  fnAddCount: function(count){
    var ids = count.id.split("-");
    var vDeals = MVPUI.prototype.userData.pvendor.get("activeDeals");
    count.name = "no name";
    if(vDeals && vDeals.length > 0){
      for(var v = 0 ; v < vDeals.length ; v++){
        if(vDeals[v].details.id == count.id){
          count.name = vDeals[v].details.items.name;
        }
      }
    }
    var togo = parseInt(count.redeemCount)-parseInt(count.count);
    var added = '<li class="item-content">'+
                '  <div class="item-media">'+
                '    <i class="fa fa-paw fa-lg"></i>'+
                '  </div>'+
                '  <div class="item-inner">'+
                '    <div class="item-subtitle">'+ 9 +' more '+ count.name+'</div>'+
                '  </div>'+
                '</li>';
    $$(".count_item_list").append(added);
  },
  fnSetSavings: function(savings){
    if(savings.message){
      MVPUI.prototype.app.alert(savings.message,"");
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
          mvpUI.app.closeModal('.login-screen');
          MVPUI.prototype.fnLoadWithLocationData();
        }else{
          $$('.login-screen').find('input[name="username"]').val("");
          $$('.login-screen').find('input[name="password"]').val("");
          MVPUI.prototype.app.alert(res,"");
        }
      });
    }
  },
  fnGetNewUser: function () {
    var newUser = {
      username: "",
      password:"",
      email: "",
      firstName:"",
      lastName:"",
      code:""
    }
    var p1 = $$('.login-screen').find('input[name="password"]').val();
    var p2 = $$('.login-screen').find('input[name="repeatPassword"]').val();
    if(p1 === p2){
      if(true){//this will check for terms check box
        newUser.username = $$('.login-screen').find('input[name="username"]').val();
        newUser.password = p1;
        newUser.email = $$('.login-screen').find('input[name="email"]').val();
        newUser.firstName = $$('.login-screen').find('input[name="firstName"]').val();
        newUser.lastName = $$('.login-screen').find('input[name="lastName"]').val();
        newUser.code = $$('.login-screen').find('input[name="vetCode"]').val();
        
        //clear values
        $$('.login-screen').find('input[name="username"]').val("");
        $$('.login-screen').find('input[name="email"]').val("");
        $$('.login-screen').find('input[name="firstName"]').val("");
        $$('.login-screen').find('input[name="lastName"]').val("");
        $$('.login-screen').find('input[name="vetCode"]').val("");
        $$('.login-screen').find('input[name="password"]').val("");
        $$('.login-screen').find('input[name="repeatPassword"]').val("");
        
        
        MVPUI.prototype.fnNewUser(newUser);
      }
    }else{
      $$('.login-screen').find('input[name="password"]').val("");
      $$('.login-screen').find('input[name="repeatPassword"]').val("");
      MVPUI.prototype.app.alert('passwords must match',"");
    }
  },
  fnNewUser: function (newUser) {
    //find vendor
    pCon.checkVetCode(newUser.code,function(pVet){
      if(typeof pVet === "string"){
        MVPUI.prototype.app.alert(pVet,"");
      }else{
        //need to add user here.
        MVPUI.prototype.app.showIndicator();
        var address = {"address":"","city":"","state":"","zip":""};
        pCon.addCustomer(newUser, address, pVet.get("vendor"),"mobile: "+newUser.lastName+","+newUser.firstName, function(res){
          if(typeof res === 'string'){
            MVPUI.prototype.app.hideIndicator();
            MVPUI.prototype.app.alert(res,"");
            newUser = null;
          }else{
            MVPUI.prototype.app.hideIndicator();
            MVPUI.prototype.fnLoginUser(newUser.username,newUser.password);
          }
        });
      }
    });
  },
  fnLogout: function () {
     mvpUI.app.confirm("are you sure you want to logout?","", function(){
        $$(".splash").show();
        Parse.User.logOut();
        MVPUI.prototype.fnLoadWithLocationData();
     },
     function(){
       //stay in app
     });
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
              MVPUI.prototype.app.alert(error.message);
            }
        });
    },
    error:function(result, error){
      MVPUI.prototype.fnModalEnd();
      MVPUI.prototype.app.alert(error.message,"Error");
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
            MVPUI.prototype.app.alert(result,"");
          }
        });
    }
  },
  fnResetPassword: function () {
    var resetEmail = $$("#mvpResetEmail").val();
    pCon.tryPasswordReset(resetEmail, function(message){
      MVPUI.prototype.app.alert(message,"");
      location.reload();
    });
  },
  fnCheckUser: function () {
    pCon.checkLogin(function(message){MVPUI.prototype.app.alert(message,"");});
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
              MVPUI.prototype.app.alert("Error: " + error.code + " " + error.message,"Error");
            });
        }else{
        $$("#old-password").val("");$$("#password").val("");$$("#password2").val("");
        MVPUI.prototype.app.alert("password confirmation did not match or password is shorter than 5 characters","Error"); 
        }
      },
      error: function (user, error) {
        $("#old-password").val("");$$("#password").val("");$$("#password2").val("");
        MVPUI.prototype.app.alert("existing password did not match","Error"); 
      }
    });
  },
  fnAddEventHandlers:function (){
      //login to app
    $$('.login-screen').find('.sign-in').on('click', mvpUI.fnGetLoginUser);
    //create a new user/customer
    $$('.login-screen').find('.send-sign-up').on('click', mvpUI.fnGetNewUser);
    //goto create screen
    $$('.login-screen').find('.create-profile').on('click', function () {
        $$('.identity').append('<li class="item-content id-repeatPassword">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Repeat Password</div>'+
                            '    <div class="item-input">'+
                            '      <input type="password" name="repeatPassword" placeholder="">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-email">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Email</div>'+
                            '    <div class="item-input">'+
                            '      <input type="email" name="email" placeholder="">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-firstName">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">First Name</div>'+
                            '    <div class="item-input">'+
                            '      <input type="text" name="firstName" placeholder="">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-lastName">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">Last Name</div>'+
                            '    <div class="item-input">'+
                            '      <input type="text" name="lastName" placeholder="">'+
                            '    </div>'+
                            '  </div>'+
                            '<li class="item-content id-vetCode">'+
                            '  <div class="item-inner">'+
                            '    <div class="item-title label">vet code</div>'+
                            '    <div class="item-input">'+
                            '      <input type="text" name="vetCode" placeholder="">'+
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
        $$('.login-screen').find('.id-vetCode').remove();
    });
    //logout
    $$('.tabbar-labels').find('.logout').on('click', mvpUI.fnLogout);
  }
}