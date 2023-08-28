var BASEURL = 'https://api.skebby.it/API/v1.0/REST/';

var MESSAGE_HIGH_QUALITY = "GP";
var MESSAGE_MEDIUM_QUALITY = "TI";
var MESSAGE_LOW_QUALITY = "SI";

/**
 * Authenticates the user given it's username and password.  Callback
 * is called when completed. If error is false, then an authentication
 * object is passed to the callback as second parameter.
 */
function login(username, password, callback) {
    $.ajax({
        url: BASEURL + 'login',
        method: 'GET',
        data: {
            username: username,
            password: password
        },
        success: function(response, textStatus, jqXHR) {
            if (jqXHR.status === 200) {
                var auth = response.split(';');
                callback(null, {
                user_key: auth[0],
                session_key: auth[1]
                });
            } else {
                callback(textStatus);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            callback(errorThrown);
        }
    });
}

/**
 * Sends an SMS message
 */
function sendSMS(auth, sendsms, callback) {
    $.ajax({
        url: BASEURL + 'sms',
        method: 'POST',
        headers: {
            'user_key': auth.user_key,
            'Session_key': auth.session_key
        },
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(sendsms),
        success: function(response, textStatus, jqXHR) {
            if (jqXHR.status === 201) {
                callback(response.result !== 'OK', response);
            } else {
                callback(false);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            callback(false);
        }
    });
}

var smsData = ""


function startSendSMS(txt, number){
    smsData = {
        "returnCredits": true,
        "recipient": [
            number
        ],
        "scheduled_delivery_time": "20171223101010",
        "message": txt,
        "message_type": MESSAGE_HIGH_QUALITY
    };

    login('mirko.menicucci@gmail.com', '#MirkoCV12345', function(error, auth) {
        if (!error) {
            sendSMS(auth, smsData, function(error, data) {
            if (error) {
                console.log("An error occurred");
            } else {
                console.log("SMS Sent!");
            }
            });
        } else {
            console.log("Unable to login");
            console.log(error);
        }
    });
}

