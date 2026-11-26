import { calendarUrls } from "./calendar.js";

const form=document.querySelector("#rsvp-form");
const status=document.querySelector("#form-status");
const confirmation=document.querySelector("#confirmation");
const submit=form.querySelector('button[type="submit"]');
const apiBase="https://jamdayapi3f85618eecc2446c887f1ba78b11b78.azurewebsites.net";

function readRsvp(){
  const data=new FormData(form);
  const name=String(data.get("name")||"").trim();
  const headcount=Number(data.get("headcount"));
  if(!name || name.length>120 || !Number.isInteger(headcount) || headcount<1 || headcount>30) return null;
  return {name,headcount};
}

form.addEventListener("submit",async(e)=>{
  e.preventDefault();
  if(submit.disabled) return;
  const payload=readRsvp();
  if(!payload){status.textContent="Please add your name and a valid headcount.";return;}

  submit.disabled=true;
  status.textContent="Sending RSVP…";
  try{
    const response=await fetch(`${apiBase}/api/rsvp`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok) throw new Error("rsvp_failed");
    const result=await response.json();
    if(result.ok!==true || typeof result.location!=="string" || !result.location.trim()) throw new Error("missing_confirmation");

    const urls=calendarUrls(result.location);
    document.querySelector("#private-location").textContent=result.location;
    document.querySelector("#google-calendar").href=urls.google;
    document.querySelector("#ics-calendar").href=urls.ics;
    form.hidden=true;
    confirmation.hidden=false;
  }catch{
    submit.disabled=false;
    status.textContent="RSVP isn't available right now. Please try again.";
  }
});
