/** shadowrun5e Group Tests.
 * @author  taMiF
 *
 * TODO: Handlebar conditional to allow for selectedSkillId to be pre selected on subsequent renders
 */


class SRGroupRollApp extends Application {
    static isOpen = false;

    constructor() {
        super();

        this.selectedSkillId = null;
        this.tokenResults = {};

        SRGroupRollApp.isOpen = true;

        Hooks.on('controlToken', async () => {
            // NOTE: Only if this is reread will getData actually have current data.
            // Unsure as to what two-way-databinding mechanism does this... but it's needed.
            // If left out render() will not display controlled tokens correctly.
            await canvas.tokens.controlled;
            this.render();
        });

        this._buildTokenResults = this._buildTokenResults.bind(this);
        this.changeSkillSelection = this.changeSkillSelection.bind(this);
        this.doGroupRoll = this.doGroupRoll.bind(this);
        this.getData = this.getData.bind(this);
    }

    _buildTokenResults() {
        this.tokenResults = {};
        canvas.tokens.controlled.forEach(token => {
            this.tokenResults[token.id] = null;
            console.error(this.tokenResults);
        });
    }

    _getHeaderButtons() {
        const defaultButtons = super._getHeaderButtons();
        const customButtons = [
            {
                label: "Roll",
                class: "grm-btn-roll",
                title: "Roll for all selected tokens\nShift: Output rolls to chat\nCtrl: Keep same rolls",
                icon: "fas fa-dice-d20",
                onclick: event => {
                    if (event.ctrlKey) {
                        console.error('TODO: output current roll to chat');
                    } else if (event.shiftKey) {
                        console.error('TODO: Roll and output to chat');
                    } else {
                        this.doGroupRoll();
                    }
                }
            }
        ];

        return customButtons.concat(defaultButtons);
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
        console.error('getData');
        const token = canvas.tokens.controlled.length ? canvas.tokens.controlled[0] : undefined;

        const data = token?.actor?.sheet?.getData();
        const skills = data?.data?.skills;
        console.error(this.tokenResults);
        console.error(canvas.tokens.controlled);

        const tokenList = [];
        const tokens = canvas.tokens.controlled;
        tokens.forEach(token => {
            tokenList.push({
                id: token.id,
                name: token.data.name,
                result: this.tokenResults[token.id]
            })
        });

        return {
            test: 'Hallo Test',
            tokens: tokenList,
            skills,
            selectedSkillId: this.selectedSkillId
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('[name="select-skill"]').change(this.changeSkillSelection);
    }

    changeSkillSelection(event) {
        console.error('changeSkillSelection');
        const skillId = event.target.value;
        if (!skillId) {
            return;
        }
        this.selectedSkillId = skillId;
    }

    doGroupRoll() {
        console.error('do Group Roll');
        console.error(game.shadowrun5e);
        const {ShadowrunRoller} = game.shadowrun5e;

        if (this.selectedSkillId) {
            const skillId = this.selectedSkillId;
            canvas.tokens.controlled.forEach(token => {
                const {actor} = token;
                const {data} = actor.sheet.getData();

                const skill = data.skills.active[skillId];
                const attribute = data.attributes[skill.attribute];

                let pool = 0;
                if (skill.value > 0) {
                    pool = attribute.value + skill.value;
                } else if (skill.value === 0 && skill.canDefault) {
                    pool = attribute.value - 1;
                }

                if (pool <= 0) {
                    console.error('Pool <= 0');
                    return;
                }

                // Build custom roll to avoid dialog display.
                const formula = ShadowrunRoller.shadowrunFormula({parts: [pool], limit: {}, explode: false});
                if (!formula) {
                    console.error('Broken formula');
                    return;
                }

                const roller = new Roll(formula);
                roller.roll();

                const {result} = roller;

                this.tokenResults[token.id] = result;
            });
        }

        this.render();
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