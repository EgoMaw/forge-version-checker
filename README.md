# Forge Version Checker

Just a simple worker that validates and checks [Forge](https://forums.minecraftforge.net/) versions for the Forge installation script from [Pterodactyl](https://github.com/pterodactyl).

The workers takes a Minecraft version (can also be latest) and a Forge version (can also be latest, recommend, or include a minecraft version prefix)
and validates them (latest and recommended get converted to actual versions if applicable).

Lastly it returns a string in the following format: `<minecraft_version>-<forge_version>` (ex. `1.20.1-47.3.11`) or JSON with an error message if something goes wrong.

The version data are checked and updated twice a day from [Forge's](https://files.minecraftforge.net/) official site.
If Forge decided to hide the data, this worker will obviously break, but for now enjoy.

## Contact Info
Please reach out to [kimon@egomaw.net](mailto:kimon@egomaw.net) for any questions.
For any bugs, please create an Issue and provide as much info as possible, thanks!
