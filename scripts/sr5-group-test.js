/** shadowrun5e Group Tests.
 * @author  taMiF
 *
 * TODO: Handlebar conditional to allow for selectedSkillId to be pre selected on subsequent renders
 * TODO: find a way to get attribute keys from system for custom attribute rolls (spell vs rolls) instead of magic value strings.
 *
 */


class SRGroupRollApp extends Application {
    static isOpen = false;

    constructor() {
        super();

        this.selectedSkillId = null;
        this.selectedRoll = null;
        this.selectedAttributesRoll = null;
        this.tokenResults = {};

        this.threshold = 0;
        this.modifier = 0;

        this.tokens = [];

        SRGroupRollApp.isOpen = true;

        Hooks.on('controlToken', async () => {
            // NOTE: Only if this is reread will getData actually have current data.
            // Unsure as to what two-way-databinding mechanism does this... but it's needed.
            // If left out render() will not display controlled tokens correctly.
            await canvas.tokens.controlled;
            this.render();
        });

        Hooks.on('updateToken', async (scene, token) => {
            // Only rerender if updated token is controlled.
            if (canvas.tokens.controlled.filter(controlledToken => controlledToken.id === token._id).length > 0) {
                // NOTE: Only if this is reread will getData actually have current data.
                // Unsure as to what two-way-databinding mechanism does this... but it's needed.
                // If left out render() will not display controlled tokens correctly.
                await canvas.tokens.controlled;
                this.render();
            }
        });

        this.onAttributeOnlyRoll = this.onAttributeOnlyRoll.bind(this);
        this.changeSkillSelection = this.changeSkillSelection.bind(this);
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
        // Use token skills instead of system template due to labels missing on system templates.
        const token = canvas.tokens.controlled.length ? canvas.tokens.controlled[0] : undefined;
        const data = token?.actor?.sheet?.getData();
        const skills = data?.data?.skills;

        this.tokens = canvas.tokens.controlled;

        const tokenList = [];
        this.tokens.forEach(token => {
            const wounds = token.actor.getWounds() * -1;
            tokenList.push({
                id: token.id,
                name: token.data.name,
                // blank for zero wounds.
                wounds:  wounds ? wounds : '',
                result: this.tokenResults[token.id]
            })
        });

        const skillList = [];
        if (skills) {
            Object.keys(skills.active).forEach(skillId => {
                const skill = skills.active[skillId];
                skillList.push({...skill, id: skillId, selected: skillId === this.selectedSkillId});
            });
        }

        return {
            test: 'Hallo Test',
            tokens: tokenList,
            skills: skillList,
            threshold: this.threshold,
            modifier: this.modifier,
            selectedSkillId: this.selectedSkillId
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('[name="select-skill"]').change(this.changeSkillSelection);
        html.find('.attribute-only-roll').click(this.onAttributeOnlyRoll);
        html.find('.surprise-roll').click(this.onSurpriseRoll);
        html.find('.soak-roll').click(this.onSoakRoll);
        html.find('.defense-roll').click(this.onDefenseRoll);
        html.find('.toxins-roll').click(this.onToxinsRoll);
        html.find('.magic-illusion-mana').click(this.onIllusionManaRoll);
        html.find('.magic-illusion-physical').click(this.onIllusionPhysicalRoll);
        html.find('.magic-combat-direct-mana').click(this.onCombatDirectManaRoll);
        html.find('.magic-combat-direct-physical').click(this.onCombatDirectPhysicalRoll);
        html.find('.magic-manipulation').click(this.onManipulationRoll);
        html.find('.magic-perception-active').click(this.onPerceptionActiveRoll);
        html.find('[name=input-threshold]').change(this.onThresholdChange);
        html.find('[name=input-modifier]').change(this.onModifierChange);
    }

    resetRollData = () => {
        this.selectedRoll = null;
        this.selectedSkillId = null;
        this.threshold = 0;
        this.selectedAttributesRoll = null;
    }

    onAttributeOnlyRoll(event) {
        this.resetRollData();

        const {roll} = event.currentTarget.dataset;
        this.selectedRoll = roll;

        this.doGroupRoll();
    }

    onSurpriseRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['reaction'] = null;
        this.selectedAttributesRoll['intuition'] = null;
        this.threshold = 3;

        this.doGroupRoll();
    }

    onSoakRoll = (event) => {
        this.resetRollData();

        this.selectedRoll = 'soak';

        this.doGroupRoll();
    }

    onDefenseRoll = (event) => {
        this.resetRollData();

        this.selectedRoll = 'defense';

        this.doGroupRoll();
    }

    onToxinsRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['body'] = null;
        this.selectedAttributesRoll['willpower'] = null;

        this.doGroupRoll();
    }

    onIllusionManaRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['willpower'] = null;
        this.selectedAttributesRoll['logic'] = null;

        this.doGroupRoll();
    }

    onIllusionPhysicalRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['intuition'] = null;
        this.selectedAttributesRoll['logic'] = null;

        this.doGroupRoll();
    }

    onCombatDirectManaRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['willpower'] = null;

        this.doGroupRoll();
    }

    onCombatDirectPhysicalRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['body'] = null;

        this.doGroupRoll();
    }

    onManipulationRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['willpower'] = null;
        this.selectedAttributesRoll['logic'] = null;

        this.doGroupRoll();
    }

    onPerceptionActiveRoll = (event) => {
        this.resetRollData();

        this.selectedAttributesRoll = {};
        this.selectedAttributesRoll['willpower'] = null;
        this.selectedAttributesRoll['logic'] = null;

        this.doGroupRoll();
    }

    changeSkillSelection(event) {
        this.resetRollData();

        const skillId = event.target.value;
        if (!skillId) {
            return;
        }
        this.selectedSkillId = skillId;

        this.doGroupRoll();
    }

    onThresholdChange = (event) => {
        this.threshold = Number(event.currentTarget.value);

        this.doGroupRoll();
    };

    onModifierChange = (event) => {
        this.modifier = Number(event.currentTarget.value);

        this.doGroupRoll();
    };

    doRoll(parts, limit = {}, explode = false) {
        // Build custom roll to avoid dialog display.
        const {ShadowrunRoller} = game.shadowrun5e;
        const formula = ShadowrunRoller.shadowrunFormula({parts, limit, explode});

        // TODO: Zero Dice formulas are catched... but the error still appears... 0_o
        if (!formula || !formula.length || formula[0] === '0') {
            return;
        }

        const roller = new Roll(formula);
        try {
            roller.roll();
        } catch (Error) {
            return {}
        }

        const glitchedDice = roller.dice[0].rolls.filter(({roll}) => roll === 1).length;
        const pool = roller.dice[0].rolls.length;
        const glitched = (glitchedDice / pool) >= 0.5;
        const netHits = this.threshold > roller.result ? 0 : roller.result - this.threshold;

        return {
            pool,
            hits: roller.result,
            netHits,
            success: roller.result > 0 && roller.result - this.threshold >= 0,
            glitched: glitched,
            limit: limit.value ? limit.value : ''
        };
    }

    doGroupRoll() {
        let pool = 0;

        if (this.selectedSkillId) {
            this.tokenResults = {};
            const skillId = this.selectedSkillId;
            this.tokens.forEach(token => {
                const {actor} = token;
                const {data} = actor.sheet.getData();
                const skill = data.skills.active[skillId];
                if (!skill) {
                    return;
                }
                const attribute = data.attributes[skill.attribute];
                const limit = data.limits[attribute.limit];
                const wounds = actor.getWounds() * -1;

                if (skill.value > 0) {
                    pool = attribute.value + skill.value;
                } else if (skill.value === 0 && skill.canDefault) {
                    pool = attribute.value - 1;
                }

                if (pool <= 0) {
                    return;
                }

                const parts = [pool, this.modifier, wounds];

                this.tokenResults[token.id] = this.doRoll(parts, limit);

            });
        } else if (this.selectedRoll === 'soak') {
            this.tokenResults = {};

            this.tokens.forEach(token => {
                const {actor} = token;
                const parts = {};
                actor._addSoakParts(parts);

                if (this.modifier) {
                    parts['Modifier'] = this.modifier;
                }

                this.tokenResults[token.id] = this.doRoll(parts);
            });
        } else if (this.selectedRoll) {
            this.tokenResults = {};

            this.tokens.forEach(token => {
                const {actor} = token;
                const {data} = actor.sheet.getData();
                const {rolls} = data;

                if (!rolls[this.selectedRoll]) {
                    return;
                }
                pool = rolls[this.selectedRoll];
                const wounds = actor.getWounds() * -1;
                const parts = [pool, this.modifier, wounds];

                this.tokenResults[token.id] = this.doRoll(parts);
            })
        } else if (this.selectedAttributesRoll) {
            this.tokenResults = {};

            this.tokens.forEach(token => {
                const {actor} = token;
                const parts = {};
                Object.keys(this.selectedAttributesRoll).forEach(selectedAttribute => {
                    const attribute = actor.findAttribute(selectedAttribute)
                    parts[attribute.label] = attribute.value;
                });

                if (this.modifier) {
                    parts['Modifier'] = this.modifier;
                }

                const wounds = actor.getWounds() * -1;
                if (wounds) {
                    parts['Wounds'] = wounds;
                }

                this.tokenResults[token.id] = this.doRoll(parts);
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