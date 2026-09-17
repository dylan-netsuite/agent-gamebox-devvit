import { requestExpandedMode } from "@devvit/web/client";
document.getElementById("play")!.addEventListener("click", (event) => {
  try {
    requestExpandedMode(event, "game");
  } catch {
    document.getElementById("error")!.hidden = false;
    document.getElementById("error")!.textContent =
      "Please reopen this post on Reddit and try again.";
  }
});
