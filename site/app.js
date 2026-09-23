const form=document.querySelector("#rsvp-form");
const status=document.querySelector("#form-status");
const confirmation=document.querySelector("#confirmation");
const submit=form.querySelector('button[type="submit"]');

function calendarUrls(event){
  const start="20261003T170000Z";
  const end="20261004T020000Z";
  const title=encodeURIComponent("Jam Day III");
  const details=encodeURIComponent("Third annual Jam Day. Bring jars + sugar.");
  const location=encodeURIComponent(event.location);
  return {
    google:`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
    ics:`data:text/calendar;charset=utf-8,${encodeURIComponent(["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Jam Day//EN","BEGIN:VEVENT","UID:jam-day-iii-2026@jamday.tyharbin.com","DTSTAMP:20260923T000000Z",`DTSTART:${start}`,`DTEND:${end}`,"SUMMARY:Jam Day III",`LOCATION:${event.location.replace(/,/g,"\\,")}`,"DESCRIPTION:Third annual Jam Day. Bring jars + sugar.","END:VEVENT","END:VCALENDAR"].join("\r\n"))}`
  };
}

function readRsvp(){
  const data=new FormData(form);
  const name=String(data.get("name")||"").trim();
  const headcount=Number(data.get("headcount"));
  if(!name || name.length>120 || !Number.isInteger(headcount) || headcount<1 || headcount>30) return null;
  return {name,headcount};
}

form.addEventListener("submit",async(e)=>{
  e.preventDefault();
  const payload=readRsvp();
  if(!payload){status.textContent="Please add your name and a valid headcount.";return;}

  submit.disabled=true;
  status.textContent="Sending RSVP…";
  try{
    const response=await fetch("/api/rsvp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok) throw new Error("rsvp_failed");
    const result=await response.json();
    if(result.ok!==true || typeof result.location!=="string" || !result.location.trim()) throw new Error("missing_confirmation");

    form.hidden=true;
    confirmation.hidden=false;
    document.querySelector("#private-location").textContent=result.location;
    const urls=calendarUrls({location:result.location});
    document.querySelector("#google-calendar").href=urls.google;
    document.querySelector("#ics-calendar").href=urls.ics;
  }catch{
    submit.disabled=false;
    status.textContent="RSVP isn't available right now. Please try again.";
  }
});
