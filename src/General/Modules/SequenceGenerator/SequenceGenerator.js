import React, { useState, useEffect, useRef } from "react";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";
import { Grid, Button, Typography, Tooltip, Paper, Divider, TextField } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

import { runCastSequence as evokerSequence } from "Retail/Engine/EffectFormulas/Evoker/PresEvokerRamps";
import { runCastSequence as discSequence } from "General/Modules/Player/DiscPriest/DiscPriestRamps";
import { runCastSequence as shamanSequence } from "Retail/Engine/EffectFormulas/Shaman/RestoShamanRamps";
import { runCastSequence as paladinSequence } from "Retail/Engine/EffectFormulas/Paladin/HolyPaladinRamps";
import { runCastSequence as druidSequence } from "Retail/Engine/EffectFormulas/Druid/RestoDruidRamps";
import { runCastSequence as monkSequence } from "Retail/Engine/EffectFormulas/Monk/MonkSpellSequence";
import { runCastSequence as holyPriestSequence } from "Retail/Engine/EffectFormulas/Priest/HolyPriestSpellSequence";

import { EVOKERSPELLDB, evokerTalents } from "Retail/Engine/EffectFormulas/Evoker/PresEvokerSpellDB";
import { DISCSPELLS, baseTalents as discTalents } from "General/Modules/Player/DiscPriest/DiscSpellDB";
import { SHAMANSPELLDB } from "Retail/Engine/EffectFormulas/Shaman/RestoShamanSpellDB";
import { PALADINSPELLDB, baseTalents as palaTalents } from "Retail/Engine/EffectFormulas/Paladin/HolyPaladinSpellDB";
import { DRUIDSPELLDB, baseTalents as druidTalents } from "Retail/Engine/EffectFormulas/Druid/RestoDruidSpellDB";
import { HOLYPRIESTSPELLDB, baseTalents as holyPriestTalents } from "Retail/Engine/EffectFormulas/Priest/HolyPriestSpellDB";
import { MONKSPELLS, baseTalents as monkTalents } from "Retail/Engine/EffectFormulas/Monk/MistweaverSpellDB";
import { buildRamp } from "General/Modules/Player/DiscPriest/DiscRampGen";
import { buildEvokerRamp } from "Retail/Engine/EffectFormulas/Evoker/PresEvokerRampGen";


import { SpellIcon } from "./SpellIcon";
import "./Sequence.css";

import SequenceSettings from "General/Modules/SequenceGenerator/SequenceSettings"

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.down("md")]: {
      margin: "auto",
      width: "100%",
      justifyContent: "center",
      display: "block",
      marginTop: 140,
    },
    [theme.breakpoints.up("sm")]: {
      margin: "auto",
      width: "80%",
      justifyContent: "center",
      display: "block",
      marginTop: 120,
    },
    [theme.breakpoints.up("md")]: {
      margin: "auto",
      width: "65%",
      justifyContent: "center",
      display: "block",
    },
    [theme.breakpoints.up("lg")]: {
      margin: "auto",
      width: "44%",
      justifyContent: "center",
      display: "block",
    },
  },
}));

const getSpellDB = (spec) => {
  if (spec === "Preservation Evoker") return EVOKERSPELLDB;
  if (spec === "Discipline Priest") return DISCSPELLS;
  if (spec === "Restoration Shaman") return SHAMANSPELLDB;
  if (spec === "Holy Paladin") return PALADINSPELLDB;
  if (spec === "Restoration Druid") return DRUIDSPELLDB;
  if (spec === "Mistweaver Monk") return MONKSPELLS;
  if (spec === "Holy Priest") return HOLYPRIESTSPELLDB;
};

const getTalentDB = (spec) => {
  if (spec === "Preservation Evoker") return evokerTalents;
  if (spec === "Discipline Priest") return discTalents;
  if (spec === "Restoration Shaman") return null;
  if (spec === "Holy Paladin") return palaTalents;
  if (spec === "Restoration Druid") return druidTalents;
  if (spec === "Mistweaver Monk") return monkTalents;
  if (spec === "Holy Priest") return holyPriestTalents;
}

const getSpecSettings = (spec) => {
  if (spec === "Preservation Evoker") {
    return {twoPc:  {value: "Yes", options: ["Yes", "No"]},
            includeOverheal: {value: "Yes", options: ["Yes", "No"]}}
  }
  else if (spec === "Discipline Priest") {
    return {includeOverheal: {title: "Include Overhealing", value: "Yes", options: ["Yes", "No"]},
            openWithDoT: {title: "Open with DoT active", value: "Yes", options: ["Yes", "No"]},
            numEnemyTargets: {title: "Num Enemy Targets", value: 1, options: [1, 2, 3, 4, 5]},
            execute: {title: "Execute", value: "Ignore", options: ["Ignore", "20% of the time", "Always"]}}
    }  
  else {
    return {};
  }
}

const compressSettings = (settings) => {
  const newObject = {}
  Object.keys(settings).forEach((key) =>  {
    newObject[key] = settings[key].value;
  });
  return newObject;
}


const getSequence = (spec) => {
  if (spec === "Preservation Evoker") return evokerSequence;
  if (spec === "Discipline Priest") return discSequence;
  if (spec === "Restoration Shaman") return shamanSequence;
  if (spec === "Holy Paladin") return paladinSequence;
  if (spec === "Restoration Druid") return druidSequence;
  if (spec === "Mistweaver Monk") return monkSequence;
  if (spec === "Holy Priest") return holyPriestSequence;
};


export default function SequenceGenerator(props) {
  const selectedSpec = props.player.getSpec();
  const spellDB = getSpellDB(selectedSpec);

  const spellCategories = ["Healing", "Damage", "Cooldowns & Other"];

  const classes = useStyles();
  const [seq, setSeq] = useState([]);
  
  const [talentDB, setTalentDB] = useState(getTalentDB(selectedSpec));
  const [result, setResult] = useState({ totalDamage: 0, totalHealing: 0, hpm: 0 });
  const [combatLog, setCombatLog] = useState([]);
  const [seqSettings, setSeqSettings] = useState(getSpecSettings(selectedSpec));

  const editSettings = (key, value) => {
    const temp = {...seqSettings};
    temp[key].value = value;
    setSeqSettings(temp);
    updateSequence(seq);

  }

  const spellList = {
    Damage: Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "damage"),
    Healing: Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "heal"),
    "Cooldowns & Other": Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "cooldown"),
  };
  const talentList = Object.keys(talentDB).filter(talent => talentDB[talent].select === true);
  const [talents, setTalents] = useState({ ...talentDB });
  

  const stats = {
    intellect: 9141,
    haste: 5138,
    crit: 1564,
    mastery: 589,
    versatility: 2845,
    stamina: 15193,

    critMult: 1,
  };

  const updateSequence = (sequence) => {
    const simFunc = getSequence(selectedSpec);
    const sim = simFunc(sequence, stats, {...{reporting: true, harshDiscipline: true}, ...compressSettings(seqSettings)}, talents);

    // multiple state updates get bundled by react into one update
    setSeq(sequence);
    setResult(sim);
    setCombatLog(sim.report);
  }

  const runIterations = (sequence, simFunc) => {
    const iter = 100;
    const results = {totalHealing: 0, totalDamage: 0, manaSpent: 0, hpm: 0};
    let finalReport = [];
  
    for (let i = 0; i < iter; i++) {
        //const baseline = runCastSequence(sequence, activeStats, settings, talents)
  
        //const simFunc = getSequence(selectedSpec);
        const sim = simFunc(sequence, stats, {...{reporting: true, harshDiscipline: true}, ...compressSettings(seqSettings)}, talents);
  
        results.totalHealing += sim.totalHealing;
        results.manaSpent += sim.manaSpent;
        results.totalDamage += sim.totalDamage;
  
        if (i === iter - 1) finalReport = sim.report;
  
        //console.log("Baseline: " + JSON.stringify(baseline));
    }
    results.hpm = results.totalHealing / results.manaSpent;
    results.totalHealing /= iter;
    results.totalDamage /= iter;
    results.manaSpent /= iter;


    setResult(results);
    setCombatLog(finalReport);
  
  }

  const addTalent = (talentName, talentDB, setTalents) => {
    const talent = talentDB[talentName];
    
    talent.points = talent.points === talent.maxPoints ? 0 : talent.points + 1;

    setTalents({...talentDB});
    updateSequence(seq);
}

  const addSpell = (spell) => {
    updateSequence([...seq, spell]);
  };

  const removeSpellAtIndex = (index, e = null) => {
    if (!!e) {
      e.preventDefault();
    }

    const editSeq = [...seq];
    editSeq.splice(index, 1);
    updateSequence(editSeq);
  }

  const insertSpellAtIndex = (spell, index) => {
    const editSeq = [
      ...seq.slice(0, index),
      spell,
      ...seq.slice(index)
    ];
    updateSequence(editSeq);
  };

  const moveSpell = (indexOld, indexNew) => {
    const editSeq = [...seq];
    const dragItemContent = editSeq[indexOld];
    editSeq.splice(indexOld, 1);
    editSeq.splice(indexNew, 0, dragItemContent);
    updateSequence(editSeq);
  };

  const clearSeq = () => {
    updateSequence([]);
  };

  const runSeq = () => {

    
    const simFunc = getSequence(selectedSpec);
    //const sim = simFunc(seq, stats, {reporting: true, harshDiscipline: true}, talents);
    runIterations(seq, simFunc);
    //setResult(sim);

  };

  const autoGen = () => {

    if (selectedSpec === "Discipline Priest") {
      updateSequence(buildRamp("Primary", 10, [], stats.haste, "", discTalents));
    }
    else if (selectedSpec === "Preservation Evoker") {
      updateSequence(buildEvokerRamp("Reversion", 0, [], stats.haste, "", evokerTalents));
    }
  };

  //#region Drag and Drop Functions
  const dragSpell = useRef();
  const dragOverSpell = useRef();
  /**
   * Drag and Drop inside of the Sequence.
   * Moves the drag target to the location of a different spell
   * using their indexes.
   *  
   * @param {*} e
   */
  const dropMove = e => {
    if (dragSpell.current === null || dragOverSpell.current === null)
      return;

    if (Number.isInteger(dragSpell.current)) {
      moveSpell(dragSpell.current, dragOverSpell.current);
    }

    dragSpell.current = null;
    dragOverSpell.current = null;
  };

  /**
   * Drag and Drop from outside into the Sequence.
   * Inserts a spell using the spell name into the list
   * at the location of your cursor.
   *  
   * @param {*} e
   */
  const dropInsertion = e => {
    if (dragSpell.current === null || Number.isInteger(dragSpell.current))
      return;

    const spell = dragSpell.current;
    // The dropping behavior is a bit weird, dropping an item on top of a spell will trigger both the spell drop & background drop so we have to circumvent double insertions
    if (e.target.className.includes("backgroundDropTarget"))
      addSpell(spell);
    else if (dragOverSpell.current !== null)
      insertSpellAtIndex(spell, dragOverSpell.current);

    dragSpell.current = null;
    dragOverSpell.current = null;
  }

  /**
   * Saves the picked up spell in a reference so we can use it
   * whenever we drop the item.
   * 
   * @param {*} e 
   * @param {*} value Either the index or the spell name
   */
  const dragStart = (e, value) => {
    dragSpell.current = value;
    $WowheadPower.clearTouchTooltip();
  };

  /**
   * @param {*} e 
   * @param {*} position Index of the spell location we're hovering over.
   */
  const dragEnter = (e, position) => {
    dragOverSpell.current = position;
  };

  const onDragOver = e => {
    // required for dnd to work
    e.preventDefault();
  }
  //#endregion

  return (
    <div style={{ backgroundColor: "#313131" }}>
      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper padding={0} elevation={0} style={{ padding: "10px 5px 10px 10px", opacity: 100, backgroundColor: "transparent" }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Sequences"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Paper style={{ padding: "8px 8px 4px 8px", minHeight: 40 }} elevation={0}>
                    <Grid container spacing={1} alignItems="center" className="backgroundDropTarget" onDragOver={onDragOver} onDrop={dropInsertion}>
                      {/*<Grid item xs="auto">
                            <LooksOneIcon fontSize="large" />
                            </Grid> */}

                      {seq.map((spell, index) => (
                        <Grid item xs="auto" key={index} onDragOver={onDragOver} onDragEnd={dropMove} onDrop={dropInsertion} onDragEnter={(e) => { dragEnter(e, index) }}>
                          <SpellIcon
                            spell={spellDB[spell][0].spellData}
                            spec={selectedSpec}
                            iconType={"Spell"}
                            draggable
                            onDragStart={(e) => { dragStart(e, index) }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              removeSpellAtIndex(index, e)}}
                            style={{ display: "flex" }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Divider />
                </Grid>

                {spellCategories.map((cat, index) => (
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Grid container>
                      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                        <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                          {cat + " Spells"}
                        </Typography>
                      </Grid>
                      <Grid container spacing={1}>
                        {spellList[cat].map((spell, i) => (
                          <Grid item xs="auto" key={spellDB[spell][0].spellData.id}>
                            <SpellIcon
                              spell={spellDB[spell][0].spellData}
                              spec={selectedSpec}
                              iconType={"Spell"}
                              draggable
                              onDragStart={(e) => { dragStart(e, spell) }}
                              onClick={(e) => addSpell(spell, e)}
                              style={{ display: "flex" }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Talents"}
                  </Typography>
                        {[1, 2, 3, 4].map((tier, i) => (
                        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>

                          <Grid container spacing={1}>
                          {talentList.map((spell, j) => (
                            talentDB[spell].tier === tier ?

                              <Grid item xs="auto" key={j} style={{paddingBottom: 7}}>
                                <SpellIcon
                                  spell={talentDB[spell]}
                                  spec={selectedSpec}
                                  iconType={"Talent"}
                                  width={25}
                                  //onDragStart={(e) => { dragStart(e, spell) }}
                                  onClick={(e) => {
                                    e.persist();
                                    addTalent(spell, talentDB, setTalents, e)
                                  }}
                                  style={{ display: "flex"}}
                                />

                          </Grid>
                               : ""
                              

                          ))}
                          <div style={{ height: 25 }} />
                          </Grid>
                              </Grid>

                        ))}

                </Grid>

                <Grid item xs={12}>
                  <Button
                    key={321}
                    variant="contained"
                    onClick={() => runSeq()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Run Sequence"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    key={321}
                    variant="contained"
                    onClick={() => clearSeq()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Clear"}
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    key={322}
                    variant="contained"
                    onClick={() => autoGen()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Auto-Generate Sequence"}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <SequenceSettings 
                      possibleSettings = {seqSettings} 
                      editSettings = {editSettings}
                      />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Results"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Paper style={{ backgroundColor: "#525252", padding: 16 }} elevation={0}>
                    <p style={{ color: "whitesmoke", paddingTop: "10px" }}>
                      {"Damage: " + result.totalDamage.toLocaleString("en-US") + ". Healing: " + result.totalHealing.toLocaleString("en-US") + ". HPM: " + Math.round(100 * result.hpm) / 100}
                    </p>
                  </Paper>
                </Grid>
                {/* Combat Log */}
                <Grid item xs={12}>
                    <TextField value={combatLog.join("\n")} variant="outlined" multiline minRows={10} maxRows={10} fullWidth disabled style={{whiteSpace: 'pre-line'}} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        <div style={{ height: 50 }} />
      </div>
    </div>
  );
}
