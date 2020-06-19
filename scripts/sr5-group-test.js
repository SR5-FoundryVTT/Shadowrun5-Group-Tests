/** shadowrun5e Group Tests.
 * @author  taMiF
 */

class SRGroupRollApp extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.width = 550;
        options.height = "auto";
        options.resizable = false;
        options.id = "group-skill-test";
        options.title = "Group Skill Test";
        options.template = "modules/sr5-group-test/templates/group-skill-test.html";
        return options;
    }

    getData() {
        return {test: 'Hallo Test'}
    }
}

const srGroupRollTokenControl = 0;

Hooks.on('getSceneControlButtons', controls => {
    controls[srGroupRollTokenControl].tools.push({
        name: 'skill',
        title: 'Group Skill Test',
        icon: 'fas fa-user-check',
        visible: game.user.isGM,
        onClick: () => {
            controls[srGroupRollTokenControl].activeTool = "select";
            if (game.system.id === 'shadowrun5e') return new SRGroupRollApp().render(true);
        }
    })
});

Hooks.on('renderTokenHUD', (...args) => {
    console.error('renderTokenHUD', args);

    console.error(canvas.tokens.controlled);
});

Hooks.on('controlToken', (token, controlled) => {

    console.error('controlToken', token, controlled);

    console.error(canvas.tokens.controlled);
});