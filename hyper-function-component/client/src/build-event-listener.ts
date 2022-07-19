export function listenBuildEvents(
  callback: (data: { action: string; payload: any }) => void
) {
  let msgId = 0;
  let retryTimes = 0;

  function fetchEvent() {
    fetch("/events" + (msgId ? "?id=" + msgId : ""))
      .then((res) => res.json())
      .then((event) => {
        retryTimes = 0;
        msgId = event.id;
        fetchEvent();

        callback(event.data);
      })
      .catch((err) => {
        console.error("fetch event error", err);
        if (retryTimes > 10) {
          return;
        }

        retryTimes++;
        setTimeout(() => {
          fetchEvent();
        }, 3000);
      });
  }
  fetchEvent();
}
