const form=document.querySelector("#rsvp-form");const status=document.querySelector("#form-status");const confirmation=document.querySelector("#confirmation");

function calendarUrls(event){
  const start="20261003T170000Z"; // 10:00 PDT
  const end="20261004T020000Z";   // 19:00 PDT
  const title=encodeURIComponent("Jam Day III");
  const details=encodeURIComponent("Third annual Jam Day. Bring jars + sugar.");
  const location=encodeURIComponent(event.location);
  return {
    google:`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
    ics:`data:text/calendar;charset=utf-8,${encodeURIComponent(["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Jam Day//EN","BEGIN:VEVENT","UID:jam-day-iii-2026@jamday.tyharbin.com","DTSTAMP:20260923T000000Z",`DTSTART:${start}`,`DTEND:${end}`,"SUMMARY:Jam Day III",`LOCATION:${event.location.replace(/,/g,"\\,")}`,"DESCRIPTION:Third annual Jam Day. Bring jars + sugar.","END:VEVENT","END:VCALENDAR"].join("\r\n"))}`
  };
}

form.addEventListener("submit",async(e)=>{
  e.preventDefault(); status.textContent="Sending RSVP…";
  const data=new FormData(form);
  const payload={name:String(data.get("name")||"").trim(),headcount:Number(data.get("headcount"))};
  try{
    const response=await fetch("/api/rsvp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok) throw new Error("rsvp_failed");
    const result=await response.json();
    if(!result.location) throw new Error("missing_confirmation");
    form.hidden=true; confirmation.hidden=false;
    document.querySelector("#private-location").textContent=result.location;
    const urls=calendarUrls({location:result.location});
    document.querySelector("#google-calendar").href=urls.google;
    document.querySelector("#ics-calendar").href=urls.ics;
  }catch{
    status.textContent="RSVP isn't available here yet. Please try again later.";
  }
});
