import React from "react";
import ReactDOM from "react-dom";
import Item from "General/Modules/Player/Item";
import Player from "General/Modules/Player/Player";
import {
  getItemAllocations,
  getItemProp,
  calcStatsAtLevel,
  getValidArmorTypes,
  getValidWeaponTypes,
  getTranslatedItemName,
  getItemEffect,
  getItemIcon,
  checkItemExists,
  getItemSlot,
  socketItem,
  getLegendaryID,
  sumObjectsByKey,
  compileStats,
  applyDiminishingReturns,
} from "./ItemUtilities";
import SPEC from "../Engine/SPECS";
import each from "jest-each";
import ClassicItem from "General/Modules/Player/ClassicItem";
import ClassicPlayer from "General/Modules/Player/ClassicPlayer";

const item1 = new Item(195481, "Scepter of Drastic Measures", getItemProp(195481, "slot", "Retail"), false, "", 0, 408, ""); // 1 Hand
const item2 = new Item(195484, "Icewrath's Channeling Conduit", getItemProp(195484, "slot", "Retail"), false, "", 0, 415, ""); // Offhand

describe("Test Item Level", () => {
  test("Sylvan Whiteshield ilvl", () => {
    const id = 181393;
    const expectedResult = 190;
    expect(getItemProp(id, "itemLevel")).toEqual(expectedResult);
  });
});

describe("Calc Stats at Level", () => {
  test("Soulwarped Seal of Wrynn", () => {
    const slot = "Finger";
    const level = 278;
    const id = 189839;
    const statAllocations = getItemAllocations(id);
    const expectedResult = {
      intellect: 0,
      stamina: 0,
      haste: 225,
      mastery: 74,
      versatility: 0,
      crit: 0,
      leech: 0,
      hps: 0,
      dps: 0,
      bonus_stats: {},
    };

    expect(true).toEqual(true); // Dragonflight placeholder. Update.
  });

  // This could use more coverage.
});

describe("Get Item Allocations func", () => {
  test("Windscale Moccasins", () => {
    const id = 179322;

    const expectedResult = {
      intellect: 5259,
      stamina: 7889,
      haste: 0,
      crit: 2450,
      mastery: 0,
      versatility: 4550,
    };

    expect(getItemAllocations(id)).toEqual(expectedResult);
  });
});

describe("getValidArmorTypes func", () => {
  test("Basic Spec Check", () => {
    const spec = SPEC.RESTODRUID;
    const expectedResult = [0, 2];

    expect(getValidArmorTypes(spec)).toEqual(expectedResult);
  });

  const itemSubclass = getItemProp(179322, "itemSubClass");
  each`
    spec     | expectedResult
    ${SPEC.RESTODRUID}   | ${false}
    ${SPEC.DISCPRIEST}  | ${true}
    ${SPEC.HOLYPALADIN}  | ${false}
    ${SPEC.HOLYPRIEST}  | ${true}
    ${SPEC.MISTWEAVERMONK}  | ${false}
    ${SPEC.RESTOSHAMAN}  | ${false}
    // add new test cases here
    `.test("Checks if $spec can wear cloth boots", ({ spec, expectedResult }) => {
    expect(getValidArmorTypes(spec).includes(itemSubclass)).toBe(expectedResult);
  });

  // TRINKET
  const itemSubclass2 = getItemProp(178826, "itemSubClass");
  each`
    spec     | expectedResult
    ${SPEC.RESTODRUID}   | ${true}
    ${SPEC.DISCPRIEST}  | ${true}
    ${SPEC.HOLYPALADIN}  | ${true}
    ${SPEC.HOLYPRIEST}  | ${true}
    ${SPEC.MISTWEAVERMONK}  | ${true}
    ${SPEC.RESTOSHAMAN}  | ${true}
    // add new test cases here
    `.test("Checks if $spec can wear a trinket", ({ spec, expectedResult }) => {
    expect(getValidArmorTypes(spec).includes(itemSubclass2)).toBe(expectedResult);
  });
});

describe("getValidWeaponTypes func", () => {
  test("Basic Spec Check", () => {
    const spec = SPEC.MISTWEAVERMONK;
    const expectedResult = [0, 4, 6, 7, 10, 13];

    expect(getValidWeaponTypes(spec, "Weapons")).toEqual(expectedResult);
  });

  // Check can use Staff
  const itemSubclass = getItemProp(178714, "itemSubClass");
  each`
    spec     | expectedResult
    ${SPEC.RESTODRUID}   | ${true}
    ${SPEC.DISCPRIEST}  | ${true}
    ${SPEC.HOLYPALADIN}  | ${false}
    ${SPEC.HOLYPRIEST}  | ${true}
    ${SPEC.MISTWEAVERMONK}  | ${true}
    ${SPEC.RESTOSHAMAN}  | ${true}
    // add new test cases here
    `.test("Checks if $spec can wear a Staff", ({ spec, expectedResult }) => {
    expect(getValidWeaponTypes(spec, "Weapons").includes(itemSubclass)).toBe(expectedResult);
  });

  // Check can use Shield
  const itemSubclass2 = getItemProp(178750, "itemSubClass");
  each`
    spec     | expectedResult
    ${SPEC.RESTODRUID}   | ${false}
    ${SPEC.DISCPRIEST}  | ${false}
    ${SPEC.HOLYPALADIN}  | ${true}
    ${SPEC.HOLYPRIEST}  | ${false}
    ${SPEC.MISTWEAVERMONK}  | ${false}
    ${SPEC.RESTOSHAMAN}  | ${true}
    // add new test cases here
    `.test("Checks if $spec can wear a Staff", ({ spec, expectedResult }) => {
    expect(getValidWeaponTypes(spec, "Offhands").includes(itemSubclass2)).toBe(expectedResult);
  });

  // Add more tests.
});

/*
describe("getTranslatedItemName func", () => {
  const id = 178869;

  each`
    lang     | expectedResult
    ${"en"}   | ${"Fleshfused Circle"}
    ${"fr"}  | ${"Cercle en chair amalgamée"}
    ${"de"}  | ${"Fleischverschmolzener Kreis"}
    // add new test cases here
    `.test("$lang expects: $expectedResult", ({ lang, expectedResult }) => {
    expect(getTranslatedItemName(id, lang, "")).toBe(expectedResult);
  });
}); */

/*
describe("GetItemEffect func", () => {
  test("Sinful Gladiator's Badge of Ferocity", () => {
    const id = 175921;
    const expectedResult = { type: "trinket", name: "Gladiator's Badge of Ferocity" };
    expect(getItemProp(id, "effect")).toEqual(expectedResult);
  }); 

  // Add new tests
});

describe("GetItemIcon func", () => {
  test("Icon Test: Unbound Changeling", () => {
    const id = 178708;
    const expectedResult = "/Images/Icons/inv_pet_spectralporcupinegreen.jpg";
    expect(getItemIcon(id)).toEqual(expectedResult);
  });

  // Add new tests
});*/

describe("CheckItemExists func", () => {
  test("Exists Test: Trailspinner Pendant", () => {
    const id = 178707;
    const expectedResult = true;
    expect(checkItemExists(id)).toEqual(expectedResult);
  });

  test("Check Invalid Item ID doesn't exist", () => {
    const id = 9999999;
    const expectedResult = false;
    expect(checkItemExists(id)).toEqual(expectedResult);
  });

  // Add new tests
});

describe("getItemSlot func", () => {
  test("Slot Check Scythewood Scepter (1H Weapon)", () => {
    const id = 178709;
    const expectedResult = "1H Weapon";
    expect(getItemProp(id, "slot")).toEqual(expectedResult);
  });

  test("Slot Check: Invalid Item ID", () => {
    const id = 9999999;
    const expectedResult = "";
    expect(getItemProp(id, "slot")).toEqual(expectedResult);
  });

  // Add new tests
});

describe("socketItem", () => {
  test("Red Gem Test", () => {
    const player = new ClassicPlayer("Mock", "Restoration Druid Classic", 99, "NA", "Stonemaul", "Night Elf");
    const item = new ClassicItem(29087, "Chestguard of Malorne", "Chest", "");

    socketItem(item, player);
  });

  // Add new tests
});

describe("GetLegendaryID func", () => {
  test("Sinister Teachings", () => {
    const legendaryID = getLegendaryID("Sinister Teachings");
    expect(legendaryID).toEqual("7726");
  });
});

describe("Test sumObjectsByKey func", () => {
  // test that the sumObjectsByKey function works correctly. used to sum main hand / off hand items etc.

  test("sumObjectsByKey", () => {
    delete item1.stats.bonus_stats; // remove bonus_stats as in the function it is set as {} after this runs fixing the problem. //TODO change the function to fix the error to begin with.
    delete item2.stats.bonus_stats;
    const obj1 = item1.stats;
    const obj2 = item2.stats;

    const expected = { intellect: 2007, stamina: 0, haste: 365, mastery: 253, versatility: 121, crit: 0, leech: 0, hps: 0, dps: 0 };
    expect(sumObjectsByKey(obj1, obj2)).toEqual(expected);
  });
});

describe("Test scoreItem func", () => {
  // test that items are scoring correctly // TODO
  test("scoreItem", () => {});
});

describe("Test compileStats func", () => {
  // test that compileStats is merging the object correctly, and adding missing stats to the final object.
  test("compileStats", () => {
    let bonus_stats = { mastery: 100, crit: 3000, versatility: 4000, intellect: 2, haste: 300, leech: 1000 };
    let item_stats = { mastery: 5000, crit: 3500, versatility: 0, intellect: 12000, haste: 0 };

    const expected = { mastery: 5100, crit: 6500, versatility: 4000, intellect: 12002, haste: 300, leech: 1000 };
    expect(compileStats(item_stats, bonus_stats)).toEqual(expected);
  });
});

describe("Test buildStatString func", () => {
  // test that buildStatString is returning the correct string for an item. // TODO
  test("buildStatString", () => {});
});

describe("Test calcStatsAtLevel func", () => {
  // test that calcStatsAtLevel is returning the correct stats for specific ilvls. // TODO
  test("calcStatsAtLevel", () => {});
});

describe("Test buildWepCombos func", () => {
  // test that buildWepCombos is building weapon combos correctly // TODO
  test("buildWepCombos", () => {});
});

describe("Test getItemCat func", () => {
  // test that getItemCat is returning the correct category for a slot // TODO
  test("getItemCat", () => {});
});

describe("Test getEmbellishmentIcon func", () => {
  // test that getEmbellishmentIcon is functioning correctly // TODO
  test("getEmbellishmentIcon", () => {});
});

describe("Test getItemIcon func", () => {
  // test that getItemIcon is returning correct icons without errors // TODO
  test("getItemIcon", () => {});
});

describe("Test applyDiminishingReturns func", () => {
  // test that applyDiminishingReturns is returning correct values // TODO
  test("applyDiminishingReturns", () => {});
});
