safari.application.addEventListener("command", performCommand, false);

function performCommand(event) {
    if (event.command == "yttracker-button") {
      var newTab = safari.application.activeBrowserWindow.openTab();
      newTab.url = "https://yttracker.mrcraftcod.fr/";
    }
}
