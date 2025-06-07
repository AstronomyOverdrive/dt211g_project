"use strict";

async function makeApiCall(url, sendTo) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Invalid response!");
        }
        const responseData = await response.json();
        switch (sendTo) {
            case "setCoords":
                setCoords(responseData);
                break;
            default:
                console.log("Invalid choice!");
        }
    } catch (error) {
        console.error(error);
        // Show notification
    }
}

function setCoords(data) {
    const CurrentLat = data.iss_position.latitude;
    const CurrentLon = data.iss_position.longitude;
    console.log(CurrentLat, CurrentLon);
}

makeApiCall("http://api.open-notify.org/iss-now.json", "setCoords");
