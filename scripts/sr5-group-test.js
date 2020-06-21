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
        this.selectedRoll = null;
        this.tokenResults = {};

        SRGroupRollApp.isOpen = true;

        Hooks.on('controlToken', async () => {
            // NOTE: Only if this is reread will getData actually have current data.
            // Unsure as to what two-way-databinding mechanism does this... but it's needed.
            // If left out render() will not display controlled tokens correctly.
            await canvas.tokens.controlled;
            this.render();
        });

        this.onAttributeOnlyRoll = this.onAttributeOnlyRoll.bind(this);
        this.changeSkillSelection = this.changeSkillSelection.bind(this);
        this.onSoakRoll = this.onSoakRoll.bind(this);
        this.onDefenseRoll = this.onDefenseRoll.bind(this);
        this.doGroupRoll = this.doGroupRoll.bind(this);
        this.getData = this.getData.bind(this);
    }

    _getHeaderButtons() {
        const defaultButtons = super._getHeaderButtons();
        const customButtons = [
            {
                label: "Roll",
                class: "grm-btn-roll",
                title: "Roll for all selected tokens\nShift: Output rolls to chat\nCtrl: Keep same rolls",
                icon: "fas fa-dice-six",
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
        // TODO: Prepare all pools here and let doGroupRoll only react to events and roll.

        console.error('getData', game);
        // Use token skills instead of system template due to labels missing on system templates.
        const token = canvas.tokens.controlled.length ? canvas.tokens.controlled[0] : undefined;
        const data = token?.actor?.sheet?.getData();
        const skills = data?.data?.skills;


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
        html.find('.attribute-only-roll').click(this.onAttributeOnlyRoll);
        html.find('.soak-roll').click(this.onSoakRoll);
        html.find('.defense-roll').click(this.onDefenseRoll);
    }

    onAttributeOnlyRoll(event) {
        console.error('onAttributeOnlyRoll', event);
        const {roll} = event.currentTarget.dataset;
        this.selectedRoll = roll;
        this.selectedSkillId = null;
        this.doGroupRoll();
    }

    onSoakRoll(event) {
        this.selectedRoll = 'soak';
        this.selectedSkillId = null;
        this.doGroupRoll();
    }

    onDefenseRoll(event) {
        this.selectedRoll = 'defense';
        this.selectedSkillId = null;
        this.doGroupRoll();
    }

    changeSkillSelection(event) {
        console.error('changeSkillSelection');
        const skillId = event.target.value;
        if (!skillId) {
            return;
        }
        this.selectedSkillId = skillId;
        this.selectedRoll = null;

        this.doGroupRoll();
    }

    doRoll(parts, limit = {}, explode = false) {
        console.error('doRoll', limit);
        // Build custom roll to avoid dialog display.
        const {ShadowrunRoller} = game.shadowrun5e;
        const formula = ShadowrunRoller.shadowrunFormula({parts, limit, explode});
        if (!formula) {
            return ;
        }

        const roller = new Roll(formula);
        roller.roll();
        const glitchedDice = roller.dice[0].rolls.filter(roll => roll === 1).length;
        const pool = roller.dice[0].rolls.length;
        const glitched = (glitchedDice / pool) >= 0.5;

        return {
            pool,
            netHits: roller.result,
            success: roller.result > 0,
            glitched: glitched,
            limit: limit.value ? limit.value : ''
        };
    }

    doGroupRoll() {
        console.error('do Group Roll');
        let pool = 0;

        if (this.selectedSkillId) {
            console.error('selectedSkill');
            this.tokenResults = {};
            const skillId = this.selectedSkillId;
            canvas.tokens.controlled.forEach(token => {
                const {actor} = token;
                const {data} = actor.sheet.getData();
                const skill = data.skills.active[skillId];
                if (!skill) {
                    return;
                }
                const attribute = data.attributes[skill.attribute];
                const limit = data.limits[attribute.limit];

                if (skill.value > 0) {
                    pool = attribute.value + skill.value;
                } else if (skill.value === 0 && skill.canDefault) {
                    pool = attribute.value - 1;
                }

                if (pool <= 0) {
                    return;
                }

                this.tokenResults[token.id] = this.doRoll([pool], limit);

            });
        } else if (this.selectedRoll === 'soak') {
            this.tokenResults = {};

            canvas.tokens.controlled.forEach(token => {
                const {actor} = token;
                const parts = {};
                actor._addSoakParts(parts);

                this.tokenResults[token.id] = this.doRoll(parts);
            });
        } else if (this.selectedRoll) {
            console.error(this.selectedRoll, canvas.tokens.controlled);
            this.tokenResults = {};

            canvas.tokens.controlled.forEach(token => {
                const {actor} = token;
                const {data} = actor.sheet.getData();
                const {rolls} = data;

                console.error(rolls, data);

                if (!rolls[this.selectedRoll]) {
                    return;
                }
                pool = rolls[this.selectedRoll];

                this.tokenResults[token.id] = this.doRoll([pool]);
            })
        }
        console.error(this.tokenResults);
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