
const TRIGGER_TEMPLATE = `
<div class="col-12 shadow p-3 mb-5 bg-white rounded" style="margin-bottom: 15px !important;" id="{trigger_name}">
<div class="row">
  <div style="cursor: pointer;" onclick="$('.collapse-{trigger_index}').collapse('toggle')" class="col-10 col-md-11">
    <h3>{trigger_name}</h3>
    <span class="text-muted" style="font-size:0.7em;">Require bot name: {require_name_val}<span>
  </div>
  <div class="col-2 col-md-1 text-right">
    <i class="fas fa-trash-alt fa-2x"></i>
  </div>
</div>
<div class="row collapse collapse-{trigger_index} text-left"  style="margin-top: 10px;">
  <div class="col-12 col-md-6">
    <h4 class="bg-success">When found:</h4>
    <ul class="list-group list-group-flush list_in">
      
    </ul>
  </div>
  <div class="col-12 col-md-6">
    <h4 class="bg-info">Reply:</h4>
    <ul class="list-group list-group-flush list_out">
      
    </ul>
  </div>

</div>
</div>
`;


const LIST_ITEM = `<li class="list-group-item">{item_val}</li>`;

/**
 * Insert a trigger (we presuppone that the trigger has the same format as in server api)
 * @param {*} trigger 
 */
function addTrigger(trigger, index)
{
    let inst = TRIGGER_TEMPLATE
    .replace(/{trigger_name}/g, trigger["name"])
    .replace(/{trigger_index}/g, index)
    .replace(/{require_name_val}/g, trigger["rnm"]);

    $("#TriggerContainer").append(inst);

    //populate lists
   
    for(let i = 0; i < trigger["in"].length; i++)
    {
        $("#"+trigger["name"]+" .list_in").append(LIST_ITEM.replace("{item_val}", trigger["in"][i]));
    }

    for(let i = 0; i < trigger["out"].length; i++)
    {
       
        $("#"+trigger["name"]+" .list_out").append(LIST_ITEM.replace("{item_val}", trigger["out"][i]));
    }
}


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


function makeTriggerPage()
{
    $.ajax({
        type: "get",
        url: "web/triggers",
        beforeSend: (req) => 
        {
            req.setRequestHeader("x-access-token", token);
        },
        success: data =>
        {
            console.log(JSON.stringify(data));
            for(let i =0; i < data["triggers"].length; i++)
            {
                addTrigger(data["triggers"][i], i);
            }
            
        },
        error: (req) =>
        {
            console.log("Something went wrong :L");
        }
        });
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
            //here we can try to load triggers
            console.log("Auth ok");
            makeTriggerPage();
        }
        else
        {
          window.location.href = "web/login"
        }
    },
    error: (req) =>
    {
        console.log("Session expired");
        window.location.href = "web/login"
    }
    });
}
else
{
  console.log("No session");
  window.location.href = "web/login";
}

