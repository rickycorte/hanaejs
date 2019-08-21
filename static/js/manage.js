
const TRIGGER_TEMPLATE = `
<div class="col-12 shadow p-3 mb-5 bg-white rounded" style="margin-bottom: 15px !important;" id="{trigger_name}">
<div class="row">
  <div onclick="$('.collapse-{trigger_index}').collapse('toggle')" class="col-10 col-md-11 clickable">
    <h3 class="trg_name">{trigger_name}</h3>
    <span class="text-muted rqr_botName" style="font-size:0.7em;">Require bot name: {require_name_val}<span>
  </div>
  <div class="col-2 col-md-1 text-right">
    <i class="fas fa-edit fa-2x clickable trg_update_btn"></i>
  </div>
</div>
<div class="row collapse collapse-{trigger_index} text-left"  style="margin-top: 10px;">
  <div class="col-12 col-md-6">
    <h4 class="bg-success">When found:
    <i class="fas fa-plus text-right clickable trg_add_in" style="position: absolute; right:20px; top:2px;"></i>
    </h4>
    <ul class="list-group list-group-flush list_in">
      
    </ul>
  </div>
  <div class="col-12 col-md-6">
    <h4 class="bg-info">Reply:
    <i class="fas fa-plus text-right clickable trg_add_out" style="position: absolute; right:20px; top:2px;"></i>
    </h4>
    <ul class="list-group list-group-flush list_out">
      
    </ul>
  </div>

</div>
</div>
`;


const LIST_ITEM = `<li class="list-group-item clickable"><p style="width:95%; display:inline-block;">{item_val}</p><i class="fas fa-edit text-right" style="position: absolute; right:5px;"></i></li>`;


let LOADED_DATA = null;

let last_collapseID = 0;

/****************************************************************
 * 
 * COMMON
 * 
 *****************************************************************/


/**
 * Search a trigger element in loaded data (by trigger name)
 * @param {*} name 
 * 
 * return trigger object
 */
function searchTriggerByName(name) {
  for (let i = 0; i < LOADED_DATA["triggers"].length; i++) {
    if (LOADED_DATA["triggers"][i]["name"] == name) {
      return LOADED_DATA["triggers"][i];
    }

  }

  return null;

}


/**
 * Iterate trigger lists to search corresponding data index and array
 * @param {*} target_name 
 * @param {*} data 
 */
function searchIndexInTrigger(trigger, data) {
  let res = { "w": "in", "i": -1 };

  for (let i = 0; i < trigger["in"].length; i++) {
    if (trigger["in"][i] == data) {
      res["i"] = i;
      return res;
    }
  }

  res["w"] = "out";

  for (let i = 0; i < trigger["out"].length; i++) {
    if (trigger["out"][i] == data) {
      res["i"] = i;
      return res;
    }
  }

  return null;
}


//UI

/**
 * Create a trigger list element and append it
 * @param {*} trigger_name 
 * @param {*} dest_arr 
 * @param {*} val 
 */
function addTriggerSubItem(trigger_name, dest_arr, val) {
  let itm = $(LIST_ITEM.replace("{item_val}", val));
  itm.click(() => { openEditModal(itm, trigger_name); });

  $("#" + trigger_name + " .list_" + dest_arr).append(itm);
}




/**
 * Insert a trigger (we presuppone that the trigger has the same format as in server api)
 * @param {*} trigger 
 */
function addTrigger(trigger) {
  let inst = $(TRIGGER_TEMPLATE
    .replace(/{trigger_name}/g, trigger["name"])
    .replace(/{trigger_index}/g, last_collapseID++)
    .replace(/{require_name_val}/g, trigger["rnm"]));

  $("#TriggerContainer").append(inst);

  //populate lists

  for (let i = 0; i < trigger["in"].length; i++) {
    addTriggerSubItem(trigger["name"], "in", trigger["in"][i]);
  }

  for (let i = 0; i < trigger["out"].length; i++) {
    addTriggerSubItem(trigger["name"], "out", trigger["out"][i]);
  }

  //bind add cllbacks
  $("#" + trigger["name"] + " .trg_add_in").click(() => { openAddTriggerItemModal(trigger["name"], "in") });
  $("#" + trigger["name"] + " .trg_add_out").click(() => { openAddTriggerItemModal(trigger["name"], "out") });

  //bind update trigger callback
  $("#" + trigger["name"] + " .trg_update_btn").click( () => { openUpdateTriggerModal(trigger["name"])});
}


/**
 * Regenrate page after trigger a id change
 */
function rebuildTriggerPage()
{
  $("#TriggerContainer").empty(); // clear page

  for(let i = 0; i < LOADED_DATA.triggers.length; i++)
  {
    addTrigger(LOADED_DATA.triggers[i]);
  }

}


function enableSubmit()
{
  $("#applyButton").removeClass("d-none");
}

/****************************************************************
 * 
 * TRIGGER ITEM EDIT MODAL
 * 
 *****************************************************************/


/**
* edit modal callback called to apply a delete in a trigger item
* @param {*} list_item 
* @param {*} target_name 
* @param {*} subdata_index 
* @param {*} isout 
*/
function editModalDeleteBtn(list_item, target_name) {
  let trg = searchTriggerByName(target_name);
  let dt_idx = searchIndexInTrigger(trg, list_item.find("p").text());

  trg[dt_idx["w"]].splice(dt_idx["i"], 1);
  list_item.remove();
  $("#editModal").modal("hide");
  enableSubmit();
}


/**
 * edit modal callback called to apply a change in a trigger item
 * @param {*} list_item 
 * @param {*} target_name 
 */
function editModalEditBtn(list_item, target_name, subdata_index, isout) {
  let trg = searchTriggerByName(target_name);
  let dt_idx = searchIndexInTrigger(trg, list_item.find("p").text());

  let newVal = $("#editModalData").val();

  trg[dt_idx["w"]][dt_idx["i"]] = newVal;
  list_item.find("p").text(newVal);

  $("#editModal").modal("hide");
  enableSubmit();
}


/**
 * Handler to open edit dialog for trigger sub items
 * @param {*} list_item 
 * @param {*} target_name 
 * @param {*} subdata_index 
 * @param {*} isout 
 */
function openEditModal(list_item, target_name) {
  console.log("Target: " + target_name);
  $("#editModalTitle").text("Edit '" + target_name + "' trigger data");


  //set value in field
  let trg = searchTriggerByName(target_name);
  let dt_idx = searchIndexInTrigger(trg, list_item.find("p").text());
  $("#editModalData").val(trg[dt_idx["w"]][dt_idx["i"]]);


  //set callbacks
  $("#editModalDelete").removeClass("d-none");

  $("#editModalUpdate").unbind("click");
  $("#editModalDelete").unbind("click");

  $("#editModalCheck").addClass("d-none");

  $("#editModalUpdate").click(() => { editModalEditBtn(list_item, target_name); });
  $("#editModalDelete").click(() => { editModalDeleteBtn(list_item, target_name); });

  $("#editModal").modal("show");
}

/****************************************************************
 * 
 * TRIGGER ITEM ADD MODAL
 * 
 *****************************************************************/

function AddTriggerModalInsert(target_name, dest_arr) {
  let trg = searchTriggerByName(target_name);

  let newVal = $("#editModalData").val();
  if (!newVal && newVal.length < 1) {
    console.log("Unable to add empty string");
    return;
  }

  trg[dest_arr].push(newVal);

  addTriggerSubItem(target_name, dest_arr, newVal);

  $("#editModal").modal("hide");
  enableSubmit();
}

function openAddTriggerItemModal(target_name, dest_arr) {

  $("#editModalTitle").text("Add new " + (dest_arr == "in" ? "matching string" : "reply") + " to '" + target_name + "'");

  //set value in field
  $("#editModalData").val("");


  //set callbacks
  $("#editModalDelete").addClass("d-none");
  $("#editModalCheck").addClass("d-none");

  $("#editModalUpdate").unbind("click");
  $("#editModalDelete").unbind("click");

  $("#editModalUpdate").click(() => { AddTriggerModalInsert(target_name, dest_arr) });

  $("#editModal").modal("show");
}


/****************************************************************
 * 
 * UPDATE TRIGGER MODAL
 * 
 *****************************************************************/

 /**
 * UpdateMoal delete callback
 * @param {*} trigger_name 
 */
function UpdateTriggerDelete(trigger_name)
{
    for(let i = 0; i < LOADED_DATA.triggers.length; i++)
    {
      if(LOADED_DATA.triggers[i].name == trigger_name)
      {
        //delete
        LOADED_DATA.triggers.splice(i,1);
        break;
      }
    }

    $("#" + trigger_name).remove();
    enableSubmit();
}

/**
 * UpdateMoal save callback
 * @param {*} trigger_name 
 */
function UpdateTriggerSaveChanges(trigger_name)
{
  let trigger = searchTriggerByName(trigger_name);

  trigger.rnm = $("#editModalRequireBotName").prop("checked");
  trigger.name = $("#editModalData").val();

  //update ui

  rebuildTriggerPage();

  $("#editModal").modal("hide");
  enableSubmit();
}

/**
 * Open edit modal for trigger name/settings/delete
 * @param {*} trigger_name 
 */
function openUpdateTriggerModal(trigger_name) {

  $("#editModalTitle").text("Update trigger '" + trigger_name + "'");

  let trigger = searchTriggerByName(trigger_name);

  //set value in field
  $("#editModalData").val(trigger_name);

  $("#editModalRequireBotName").prop('checked', trigger.rnm);


  //set callbacks
  $("#editModalDelete").removeClass("d-none");

  $("#editModalUpdate").unbind("click");
  $("#editModalDelete").unbind("click");

  $("#editModalUpdate").click(() => { UpdateTriggerSaveChanges(trigger_name); });
  $("#editModalDelete").click(() => { UpdateTriggerDelete(trigger_name) });

  $("#editModal").modal("show");
}


/****************************************************************
 * 
 * CREATE NEW TRIGGER MODAL
 * 
 *****************************************************************/

/**
 * UpdateMoal save callback
 * @param {*} trigger_name 
 */
function CreateTriggerSaveChanges()
{

  let trigger_name = $("#editModalData").val();

  let trigger = searchTriggerByName(trigger_name);

  if(trigger || !trigger_name)
  {
    //no duplicate
    $("#editModal").modal("hide");
    console.log("Detected duplicate");
    return;
  }


  trigger  = {};

  trigger.rnm = $("#editModalRequireBotName").prop("checked");
  trigger.name = trigger_name;
  trigger.in = [];
  trigger.out = [];

  //update ui

  LOADED_DATA.triggers.push(trigger);

  addTrigger(trigger);

  $("#editModal").modal("hide");
  enableSubmit();
}

/**
 * Open create trigger modal
 */
function openCreateTriggerModal() {

  $("#editModalTitle").text("Create a new trigger");

  //set value in field
  $("#editModalData").val("");

  $("#editModalRequireBotName").prop('checked', true);


  //set callbacks
  $("#editModalDelete").addClass("d-none");

  $("#editModalUpdate").unbind("click");
  $("#editModalDelete").unbind("click");

  $("#editModalUpdate").click(() => { CreateTriggerSaveChanges(); });

  $("#editModal").modal("show");
}

/****************************************************************
 * 
 * COOKIES :3
 * 
 *****************************************************************/

function setCookie(cname, cvalue, exhours) {
  var d = new Date();
  d.setTime(d.getTime() + (exhours * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
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



/****************************************************************
* 
* PAGE GENERATION
* 
*****************************************************************/

/**
* generate trigger items
*/
function makeTriggerPage(token) {
  $.ajax({
    type: "get",
    url: "web/triggers",
    beforeSend: (req) => {
      req.setRequestHeader("x-access-token", token);
    },
    success: data => {
      console.log(JSON.stringify(data));
      LOADED_DATA = data;
      for (let i = 0; i < data["triggers"].length; i++) {
        addTrigger(data["triggers"][i]);
      }

      $("#createNewTrigger").click( () => { openCreateTriggerModal(); });

    },
    error: (req) => {
      console.log("Something went wrong :L");
    }
  });
}




/****************************************************************
* 
* PAGE LOAD
* 
*****************************************************************/


/**
 * Check session and load page
 */
let token = getCookie("token");
if (token != "") {
  $.ajax({
    type: "get",
    url: "auth/check",
    beforeSend: (req) => {
      req.setRequestHeader("x-access-token", token);
    },
    success: data => {

      if (data["auth"]) {
        //here we can try to load triggers
        console.log("Auth ok");
        makeTriggerPage(token);
      }
      else {
        window.location.href = "web/login"
      }
    },
    error: (req) => {
      console.log("Session expired");
      window.location.href = "web/login"
    }
  });
}
else {
  console.log("No session");
  window.location.href = "web/login";
}


/****************************************************************
* 
* SUBMIT
* 
*****************************************************************/

$(document).ready( ()=> {

  $("#applyButton").click( ()=>
  {
    console.log("Everybody gonna QUACK <3");
  
    $("#applyButton").addClass("d-none");
    $("#block-overlay").removeClass("d-none");
  
    $.ajax({
      type: "post",
      url: "web/update",
      contentType: "application/json",
      dataType: "json",
      beforeSend: (req) => {
        req.setRequestHeader("x-access-token", token);
      },
      data: JSON.stringify(LOADED_DATA),
      success: data => {
        console.log("Updated :3");
        $("#block-overlay").addClass("d-none"); 
      },
      error: (req) => {
        console.log("Something went wrong :L");
        $("#block-overlay").addClass("d-none");
      }
    });
  
  
  });
});

