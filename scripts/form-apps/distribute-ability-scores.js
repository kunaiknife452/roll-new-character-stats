import { DiceRoller } from "../dice-roller.js";
// import JSON_Helper from "../../data/json-helper.js";
import SYSTEM_Helper from "../../data/system-helper.js";

Hooks.on('renderDistributeAbilityScores', () => {
  // Add dragstart listeners for each result element
  const dice_roller = new DiceRoller;
  for (let i = 0; i < dice_roller._settingNumberOfRollsCount(); i++) {
    const div_final_result = document.getElementById("div_final_result" + i);
    if (div_final_result) {
      div_final_result.addEventListener("dragstart", dragstart_handler);
    }
  }
  const ability_scores = document.getElementById("ability_scores");
  if (ability_scores.dataset.distributeresults === "false") { ApplyAsRolled(); }
});

function dragstart_handler(ev) {
  ev.dataTransfer.setData("text/plain", ev.target.parentElement);
  ev.dataTransfer.setData("text/plain", ev.target.innerText); // value of element being dragged
  ev.dataTransfer.setData("text/plain", ev.target.id);        // id of element being dragged
  ev.dataTransfer.dropEffect = "copy";
}

export class DistributeAbilityScores extends FormApplication {
  constructor(final_results, bonus_points, over18allowed, distributeResults, msgId, abilities, races) {
    super();
    this.final_results = final_results,
    this.bonus_points = bonus_points,
    this.over18allowed = over18allowed,
    this.distributeResults = distributeResults,
    this.msgId = msgId,
    this.abilities = abilities,
    this.races = races
  }

  // async close() {
  //   const msg = game.messages.get(this.msgId);
  //   let content = duplicate(msg.data.content);
  //   await msg.update({content: content});
  //   super.close();
  // }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("RNCS.dialog.results-button.configure-new-actor"),
      id: 'distribute-ability-scores',
      icon: 'fas fa-cogs', // Change?
      template: "./modules/roll-new-character-stats/templates/form-apps/distribute-ability-scores.html",
      height: 525,
      width: 375,
      closeOnSubmit: true,
      submitOnClose: false
    });
  }

  async getData() {
    const system_helpler = new SYSTEM_Helper();
    return {      
      final_results: this.final_results,
      bonus_points: this.bonus_points,
      over18allowed: this.over18allowed,
      distributeResults: this.distributeResults,
      msgId: this.msgId,
      abilities: await system_helpler.getSystemAbilities(),
      races: await system_helpler.getSystemRaces()
    };
  }

  async _updateObject(event, formData) {

    let actor = await Actor.create({
      name: (formData.charactername === "New Actor" || formData.charactername === "" ? formData.select_race : formData.charactername),
      type: "character",
      img: "icons/svg/mystery-man.svg"
    });


// TODO-MEDIUM: Include other racial skills/features/bonuses/languages

    switch (game.system.id) {
      case "dnd5e":
        // _final_score_display includes Racial Mod - will revisit this when dnd5e implements race items (see pf1).
        await actor.update({
          'data.details.race': formData.select_race,
          'data.abilities.str.value': formData.str_final_score_display, 
          'data.abilities.dex.value': formData.dex_final_score_display,
          'data.abilities.con.value': formData.con_final_score_display,
          'data.abilities.int.value': formData.int_final_score_display,
          'data.abilities.wis.value': formData.wis_final_score_display,
          'data.abilities.cha.value': formData.cha_final_score_display
        });
        break;

      case "pf1":
        // _final_score_unmod does not include Racial Mod as that value is added by embedded obj_race_item
        await actor.update({
          'data.abilities.str.value': formData.str_final_score_unmod, 
          'data.abilities.dex.value': formData.dex_final_score_unmod,
          'data.abilities.con.value': formData.con_final_score_unmod,
          'data.abilities.int.value': formData.int_final_score_unmod,
          'data.abilities.wis.value': formData.wis_final_score_unmod,
          'data.abilities.cha.value': formData.cha_final_score_unmod
        });

        // Add race item
        const pack = game.packs.get("pf1.races");
        const itemId = pack.index.getName(formData.select_race)?._id;
        if (itemId) {
          const race_item = await pack.getDocument(itemId);
          const obj_race_item = race_item.data.toObject();
          await actor.createEmbeddedDocuments("Item", [obj_race_item]);
        }
        break;

      default:// default to dnd5e for now
        await actor.update({
          'data.details.race': formData.select_race,
          'data.abilities.str.value': formData.str_final_score_display,
          'data.abilities.dex.value': formData.dex_final_score_display,
          'data.abilities.con.value': formData.con_final_score_display,
          'data.abilities.int.value': formData.int_final_score_display,
          'data.abilities.wis.value': formData.wis_final_score_display,
          'data.abilities.cha.value': formData.cha_final_score_display
        });
        break;
    }
  }
}

window.DistributeAbilityScores = DistributeAbilityScores;