


function setCookie(cname, cvalue, exhours) {
    var d = new Date();
    d.setTime(d.getTime() + (exhours*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


let token = getCookie("token");
if(token != "")
{
        $.ajax({
        type: "get",
        url: "web/check",
        beforeSend: (req) => 
        {
            req.setRequestHeader("x-access-token", token);
        },
        success: data =>
        {

            if(data["auth"])
            {
                //redirect to logged page
                console.log("Already logged :3");
            }
        }
        });
}


function tryLogin()
{
    console.log("login attempt for: " + $("#userID").val());

    $.ajax(
        {
            type:"post",
            url:"web/login",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({ "user": $("#userID").val() }),
            success: function(data)
            {
                console.log(data);

                if(data["auth"])
                {
                    setCookie("token", data["token"], 1);
                    console.log("Logged in :3");
                }
                else
                {
                    console.log("Failed login");
                    $("#userID").addClass("is-invalid");
                }
            }
        }
    );
}