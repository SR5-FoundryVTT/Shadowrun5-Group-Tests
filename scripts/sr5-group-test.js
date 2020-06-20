/** shadowrun5e Group Tests.
 * @author  taMiF
 */

class SRGroupRollApp extends Application {
    static isOpen = false;

    constructor() {
        super();

        SRGroupRollApp.isOpen = true;
    }
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
        console.error(game);
        const token = canvas.tokens.controlled.length ? canvas.tokens.controlled[0] : undefined;
        console.error(token);
        const {data} = token.actor.sheet.getData();
        const {skills} = data;
        console.error(data);

        return {
            test: 'Hallo Test',
            tokens: canvas.tokens.controlled,
            skills
        }
    }

    async handleControlToken() {
        return (token, controlled) => {
            this.render(true);
        }
    }
}

const srGroupRollTokenControl = 0;

const buttons = {
    roll: {
        label: 'Roll', // TODO: i18n
        icon: '<i class="fas fa-bomb></i>"',
        callback: () => {
            test: 'Test'
        }
    }
};



Hooks.on('getSceneControlButtons', controls => {
    controls[srGroupRollTokenControl].tools.push({
        name: 'skill',
        title: 'Group Skill Test',
        icon: 'fas fa-user-check',
        visible: game.user.isGM,
        onClick: () => {
            // Disable selection of SR5GroupRoll Tool.
            controls[srGroupRollTokenControl].activeTool = "select";
            if (game.system.id === 'shadowrun5e') {
                return new SRGroupRollApp().render(true);
            }
        }
    })
});

Hooks.on('renderTokenHUD', (...args) => {
    console.error('renderTokenHUD', args);

    console.error(canvas.tokens.controlled);
});

Hooks.on('controlToken', (token, controlled) => {
    if (SRGroupRollApp.isOpen) {
        new SRGroupRollApp().render(true);
    }
});