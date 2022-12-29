import http from "../../services/http";

export const putAlarmWanted = params => new Promise((resolve) => {
    http
        .put('/user/' + params.userId + '/auction/' + params.auctionId + '?alarmWanted=' + params.alarmWanted)
        .then((response) => {
            resolve(response)
        });
});