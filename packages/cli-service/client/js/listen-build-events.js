function listenBuildEvents(handler) {
  let msgId = 0;
  let retryTimes = 0;

  function fetchEvent() {
    fetch("/events" + (msgId ? "?id=" + msgId : ""))
      .then((res) => res.json())
      .then((event) => {
        retryTimes = 0;
        msgId = event.id;
        fetchEvent();

        handler(event.data);
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
