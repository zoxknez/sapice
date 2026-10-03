import {getLibraryMaterial} from "@/data/material-library";
import type {PracticalModel} from "@/lib/practical/domain";
import type {PracticalEnvelope, PracticalStep} from "@/lib/practical/compiler";

const nm = (id: string) => {
  const material = getLibraryMaterial(id);
  return {sr: material.nameSr.toLocaleLowerCase("sr"), en: material.nameEn.toLocaleLowerCase("en")};
};

const mmText = (value: number) => `${Math.round(value)} mm`;

function entranceStep(envelope: PracticalEnvelope, through: {sr: string; en: string}): PracticalStep {
  const entrance = envelope.entrances[0];
  if (!entrance) {
    return {id: "entrance", titleSr: "Otvorena strana", titleEn: "Open side", detailSr: "Konstrukcija nema ulaz; jedna strana ostaje potpuno otvorena.", detailEn: "The structure has no entrance; one side stays fully open."};
  }
  return {
    id: "entrance",
    titleSr: "Isecite ulaz",
    titleEn: "Cut the entrance",
    detailSr: `Isecite otvor ${mmText(entrance.widthMm)} × ${mmText(entrance.heightMm)} kroz ${through.sr}, sa pragom ${mmText(entrance.sillMm)} iznad poda da kiša i sneg ne ulaze. Ulaz okrenite od dominantnog vetra. Oštre ivice obložite ili obrusite.`,
    detailEn: `Cut a ${mmText(entrance.widthMm)} × ${mmText(entrance.heightMm)} opening through ${through.en}, with the sill ${mmText(entrance.sillMm)} above the floor so rain and snow stay out. Face the entrance away from the prevailing wind. Cover or sand sharp edges.`
  };
}

function raiseStep(model: PracticalModel, clearanceMm: number): PracticalStep {
  const how = "raiseWith" in model.params ? model.params.raiseWith : "NONE";
  const withSr: Record<string, string> = {BRICKS: "na četiri stabilne cigle", PALLET: "na proverenu paletu", BATTENS: "na dve letve", LEGS: "na četiri noge", NONE: "na suvu, ravnu podlogu"};
  const withEn: Record<string, string> = {BRICKS: "on four stable bricks", PALLET: "on a checked pallet", BATTENS: "on two battens", LEGS: "on four legs", NONE: "on a dry, level base"};
  return {
    id: "raise",
    titleSr: "Podignite sklonište od tla",
    titleEn: "Raise the shelter off the ground",
    detailSr: `Postavite sklonište ${withSr[how]}, približno ${mmText(clearanceMm)} iznad tla, da hladna i vlažna podloga ne bi bila u kontaktu sa podom. Proverite da se ne klati.`,
    detailEn: `Set the shelter ${withEn[how]}, about ${mmText(clearanceMm)} above the ground, so the floor does not touch cold, wet ground. Check that it does not rock.`
  };
}

function beddingStep(model: PracticalModel): PracticalStep {
  if (model.bedding === "straw") {
    return {
      id: "bedding",
      titleSr: "Dodajte slamu, ne seno",
      titleEn: "Add straw, not hay",
      detailSr: "Rastresito napunite slamu do četvrtine ili polovine visine unutrašnjosti. Ne koristite seno, peškire ni ćebad u spoljnom zimskom skloništu: upijaju vlagu i hlade.",
      detailEn: "Loosely fill straw to a quarter or half of the interior height. Do not use hay, towels or blankets in an outdoor winter shelter: they absorb moisture and chill."
    };
  }
  if (model.bedding === "washable-dog-bed") {
    return {
      id: "bedding",
      titleSr: "Posteljina",
      titleEn: "Bedding",
      detailSr: "Koristite perivu podlogu samo ako prostor ostaje suv; vlažnu odmah zamenite.",
      detailEn: "Use a washable bed only if the space stays dry; swap it as soon as it is damp."
    };
  }
  return {
    id: "bedding",
    titleSr: "Bez posteljine",
    titleEn: "No bedding",
    detailSr: "Leti ostavite čistu, hladnu podlogu bez posteljine koja zadržava toplotu.",
    detailEn: "In summer leave a clean, cool surface without heat-holding bedding."
  };
}

function placementStep(model: PracticalModel): PracticalStep {
  if (model.seasons.includes("SUMMER") && !model.seasons.includes("WINTER")) {
    return {
      id: "placement",
      titleSr: "Postavite u punu senku",
      titleEn: "Place in full shade",
      detailSr: "Mesto mora biti u senci tokom najtoplijeg dela dana, na travi ili zemlji, ne na vrelom betonu ili limu. Sveža voda mora biti u blizini, a životinja mora moći slobodno da ode na hladnije mesto.",
      detailEn: "The spot must be shaded through the hottest part of the day, on grass or soil, not on hot concrete or metal. Fresh water must be nearby and the animal must be free to move somewhere cooler."
    };
  }
  return {
    id: "placement",
    titleSr: "Izaberite mesto i pričvrstite",
    titleEn: "Choose the spot and secure it",
    detailSr: "Postavite uz zid ili ogradu, zaštićeno od vetra, van puta vode sa krovova i van domašaja pasa lutalica. Lagana skloništa opteretite ili pričvrstite. Proverite mesto kontrolnom listom za postavljanje.",
    detailEn: "Set it against a wall or fence, out of the wind, away from roof runoff and roaming dogs. Weight or secure lightweight shelters. Check the spot with the placement checklist."
  };
}

export function familySteps(model: PracticalModel, envelope: PracticalEnvelope): PracticalStep[] {
  const p = model.params;
  const steps: PracticalStep[] = [];
  switch (p.family) {
    case "EMERGENCY_WRAP": {
      const container = nm(p.container.materialId);
      steps.push({
        id: "prepare",
        titleSr: "Pripremite posudu",
        titleEn: "Prepare the container",
        detailSr: `Uzmite suv i čist ${container.sr}. Zatvorite i učvrstite stranice da se kutija ne bi otvorila.`,
        detailEn: `Take a dry, clean ${container.en}. Close and secure the sides so the box cannot open.`
      });
      steps.push(entranceStep(envelope, container));
      if (p.wrapMaterialId) {
        steps.push({
          id: "wrap",
          titleSr: "Obmotajte spolja, ulaz ostaje otvoren",
          titleEn: "Wrap the outside, keep the entrance open",
          detailSr: "Prekrijte krov i zidove folijom ili debelom kesom i zalepite trakom sa spoljne strane. Folija se ne sme nalaziti unutra i nikad ne zatvara ulaz; ostavite donji deo ulaza slobodnim zbog kondenzacije.",
          detailEn: "Cover the roof and walls with film or a heavy bag and tape it on the outside. The film must not be inside and must never close the entrance; keep the lower edge of the entrance free because of condensation."
        });
      }
      steps.push(raiseStep(model, envelope.groundClearanceMm), beddingStep(model), placementStep(model));
      steps.push({
        id: "daily-check",
        titleSr: "Proveravajte svaki dan",
        titleEn: "Check every day",
        detailSr: "Ovo je samo hitno rešenje. Svakog dana proverite da li je suvo; čim se karton navlaži ili deformiše, zamenite ga. Što pre pređite na trajno vodootporno sklonište.",
        detailEn: "This is an emergency solution only. Check daily that it is dry; as soon as the cardboard gets damp or deforms, replace it. Move to a durable waterproof shelter as soon as possible."
      });
      break;
    }
    case "FOAM_CONTAINER": {
      steps.push({
        id: "clean",
        titleSr: "Proverite i očistite kutiju",
        titleEn: "Check and clean the box",
        detailSr: "Koristite samo čistu stiropor kutiju bez ostataka ribe, lekova ili hemikalija i sa poklopcem koji dobro naleže.",
        detailEn: "Use only a clean foam box with no fish, medical or chemical residue and a lid that fits well."
      });
      steps.push(entranceStep(envelope, nm("eps-shipping-box")));
      if (p.outerShell === "TOTE") {
        steps.push({id: "outer", titleSr: "Stavite kutiju u plastičnu kutiju", titleEn: "Put the box inside a tote", detailSr: "Stiropor kutiju stavite u veću plastičnu kutiju i isecite poravnat ulaz kroz obe. Plastika štiti penu od kiše, sunca i grebanja spolja.", detailEn: "Place the foam box inside a larger tote and cut an aligned entrance through both. The plastic protects the foam from rain, sun and outside scratching."});
      } else if (p.outerShell === "WRAP") {
        steps.push({id: "outer", titleSr: "Zaštitite od kiše", titleEn: "Protect from rain", detailSr: "Prekrijte kutiju folijom sa spoljne strane, bez zatvaranja ulaza.", detailEn: "Cover the box with film on the outside without closing the entrance."});
      }
      steps.push({id: "lid", titleSr: "Učvrstite poklopac", titleEn: "Secure the lid", detailSr: "Poklopac zalepite trakom sa spoljne strane i opteretite ciglom da ga vetar ne podigne.", detailEn: "Tape the lid on the outside and weight it with a brick so wind cannot lift it."});
      steps.push(raiseStep(model, envelope.groundClearanceMm), beddingStep(model), placementStep(model));
      break;
    }
    case "TOTE_IN_TOTE": {
      const tote = nm("plastic-tote");
      if (p.liningMode === "FOAM_LINER" && p.foam) {
        const foam = nm(p.foam.materialId);
        steps.push({id: "liner", titleSr: "Isecite oblogu od pene", titleEn: "Cut the foam liner", detailSr: `Prema krojnoj listi isecite pod, zidove i ploču ispod poklopca od ${foam.sr} debljine ${mmText(p.foam.thicknessMm)}. Mere su za nominalnu kutiju: pre sečenja izmerite unutrašnjost svoje kutije.`, detailEn: `Following the cut list, cut the floor, walls and lid slab from ${mmText(p.foam.thicknessMm)} ${foam.en}. Sizes assume the nominal tote: measure your tote's interior before cutting.`});
      }
      if ((p.liningMode === "FOAM_SLAB_AND_INNER_TOTE" || p.liningMode === "FOAM_GAP_AND_INNER_TOTE") && p.foam) {
        steps.push({id: "slab", titleSr: "Ploča od pene na dno", titleEn: "Foam slab on the bottom", detailSr: "Na dno velike kutije položite ploču od pene, pa na nju stavite manju kutiju tako da ostane razmak sa svih strana.", detailEn: "Lay a foam slab in the bottom of the large tote and set the small tote on it, leaving a gap on every side."});
        if (p.liningMode === "FOAM_GAP_AND_INNER_TOTE") {
          steps.push({id: "gap", titleSr: "Popunite procep", titleEn: "Fill the gap", detailSr: "U procep između kutija postavite ploče od pene prema krojnoj listi. Ako procep nije dovoljno širok, napunite ga slamom.", detailEn: "Fit foam panels from the cut list into the gap between the totes. If the gap is too narrow, fill it with straw."});
        }
      }
      steps.push(entranceStep(envelope, p.innerTote && p.liningMode !== "FOAM_LINER" && p.liningMode !== "NONE" && p.liningMode !== "STRAW_ONLY" ? {sr: "obe kutije, poravnato", en: "both totes, aligned"} : tote));
      steps.push({id: "lid", titleSr: "Zatvorite i opteretite", titleEn: "Close and weight it", detailSr: "Zatvorite poklopac i stavite ciglu ili kamen na njega. Lagana kutija se mora pričvrstiti protiv vetra.", detailEn: "Close the lid and put a brick or stone on it. A light tote must be secured against wind."});
      steps.push(raiseStep(model, envelope.groundClearanceMm), beddingStep(model), placementStep(model));
      break;
    }
    case "CRATE": {
      const ins = nm(p.outerInsulation.materialId);
      steps.push({id: "check", titleSr: "Proverite sanduk", titleEn: "Check the crate", detailSr: "Sanduk mora biti čvrst, bez truleži, viraćih spajalica i eksera. Proverite ga kontrolnom listom za ponovnu upotrebu.", detailEn: "The crate must be sturdy, without rot, protruding staples or nails. Check it with the reuse checklist."});
      steps.push({id: "insulate", titleSr: "Izolacija spolja", titleEn: "Insulate on the outside", detailSr: `Ploče od ${ins.sr} postavite oko sanduka sa spoljne strane, tako da životinja unutra dodiruje drvo, a ne penu.`, detailEn: `Fit ${ins.en} boards around the outside of the crate so the animal touches wood inside, not foam.`});
      steps.push(entranceStep(envelope, {sr: "izolaciju i letvice sanduka", en: "the insulation and crate slats"}));
      steps.push({id: "wrap", titleSr: "Vodootporni omotač", titleEn: "Waterproof wrap", detailSr: "Preko izolacije postavite vodootpornu foliju, preklopite je na krovu i zalepite spolja. Ulaz ostaje otvoren.", detailEn: "Wrap waterproof film over the insulation, overlap it on the roof and tape it outside. The entrance stays open."});
      steps.push(raiseStep(model, envelope.groundClearanceMm), beddingStep(model), placementStep(model));
      break;
    }
    case "PALLET_FRAME": {
      steps.push({id: "inspect", titleSr: "Proverite palete", titleEn: "Inspect the pallets", detailSr: "Svaka paleta mora proći kontrolnu listu: bez mrlja, mirisa hemikalija, ulja, truleži i buđi. ISPM 15 oznaka potvrđuje samo fitosanitarni tretman, ne istoriju palete.", detailEn: "Every pallet must pass the checklist: no stains, chemical smell, oil, rot or mould. An ISPM 15 mark confirms only a phytosanitary treatment, not the pallet's history."});
      steps.push({id: "cut", titleSr: "Isecite delove paleta", titleEn: "Cut the pallet sections", detailSr: "Isecite delove prema krojnoj listi tako da na kraju svakog dela ostane nosač ili kocka. Uklonite sve eksere koji vire i obrusite ivice.", detailEn: "Cut sections per the cut list so a stringer or block remains at each end. Remove protruding nails and sand the edges."});
      steps.push({id: "assemble", titleSr: "Sastavite okvir", titleEn: "Assemble the frame", detailSr: "Podnu paletu postavite ravno, pa na nju pričvrstite zadnji i bočne delove i povežite uglove letvama. Prednji delovi ostavljaju otvor za ulaz.", detailEn: "Set the floor pallet level, fix the back and side sections onto it and tie the corners with battens. The front sections leave the entrance opening."});
      if (p.cavityInsulation) steps.push({id: "insulate", titleSr: "Izolacija u šupljinama", titleEn: "Insulate the cavities", detailSr: "Ploče izolacije isecite na meru između nosača paleta i postavite ih u šupljine zidova.", detailEn: "Cut insulation boards to fit between the pallet stringers and place them in the wall cavities."});
      if (p.cladding) steps.push({id: "clad", titleSr: "Zatvorite razmake spolja", titleEn: "Close the gaps outside", detailSr: "Spolja pričvrstite oblogu da vetar i kiša ne prolaze kroz razmake između dasaka.", detailEn: "Fix cladding on the outside so wind and rain cannot pass through the gaps between boards."});
      if (p.lining) steps.push({id: "line", titleSr: "Unutrašnja obloga", titleEn: "Interior lining", detailSr: "Iznutra postavite oblogu tako da životinja ne dodiruje izolaciju ni oštre delove palete.", detailEn: "Fit an interior lining so the animal touches neither insulation nor rough pallet parts."});
      steps.push({id: "roof", titleSr: "Krov sa padom ka nazad", titleEn: "Roof falling to the rear", detailSr: `Postavite dve klinaste letve tako da krov pada ${mmText(p.roofFallMm)} ka nazad, pričvrstite krovnu ploču i pokrivač. Voda mora oticati iza kućice, dalje od ulaza.`, detailEn: `Fit two tapered battens so the roof falls ${mmText(p.roofFallMm)} to the rear, then fix the roof board and covering. Water must run off behind the house, away from the entrance.`});
      steps.push(beddingStep(model), placementStep(model));
      break;
    }
    case "SHADE_STRUCTURE": {
      steps.push({id: "frame", titleSr: "Sastavite okvir", titleEn: "Build the frame", detailSr: "Sastavite stubove i gornje grede tako da je prednja strana viša od zadnje. Okvir mora stajati stabilno; po potrebi ga ukopajte ili pričvrstite.", detailEn: "Assemble the posts and top rails so the front is higher than the rear. The frame must stand firmly; anchor it if needed."});
      steps.push({id: "canopy", titleSr: "Postavite krov", titleEn: "Fit the canopy", detailSr: "Pričvrstite krovnu ploču sa prepustom. Za letnju senku birajte svetlu završnu boju; tamna i metalna površina na suncu se jako zagrevaju.", detailEn: "Fix the canopy with its overhang. For summer shade choose a light finish; dark and metal surfaces heat up strongly in sun."});
      if (p.sides !== "OPEN") steps.push({id: "sides", titleSr: "Paneli protiv vetra i kiše", titleEn: "Wind and rain panels", detailSr: "Postavite zatvorene stranice samo na stranu odakle duva vetar ili dolazi kiša. Prednja strana ostaje otvorena.", detailEn: "Fit closed panels only on the side the wind or rain comes from. The front stays open."});
      if (p.platform) steps.push({id: "platform", titleSr: "Podignuto ležište", titleEn: "Raised bed", detailSr: "Ležište podignuto od tla pomaže da vazduh struji ispod životinje i da je dalje od vlažne ili vrele podloge.", detailEn: "A bed raised off the ground lets air move beneath the animal and keeps it away from damp or hot ground."});
      steps.push(placementStep(model));
      break;
    }
    case "RAISED_PLATFORM": {
      steps.push({id: "frame", titleSr: "Sastavite okvir i noge", titleEn: "Assemble frame and legs", detailSr: "Spojite okvir i noge, proverite da je ravno i da se ne klati.", detailEn: "Join the frame and legs, check that it is level and does not rock."});
      steps.push({id: "top", titleSr: "Pričvrstite ploču", titleEn: "Fix the top", detailSr: "Pričvrstite ploču, upustite glave šrafova i obrusite ivice.", detailEn: "Fix the top board, countersink screw heads and sand the edges."});
      steps.push(placementStep(model));
      break;
    }
    case "RETROFIT": {
      const has = (item: (typeof p.items)[number]) => p.items.includes(item);
      if (has("ROOF_MEMBRANE")) steps.push({id: "roof", titleSr: "1. Zaustavite prodor vode", titleEn: "1. Stop water ingress", detailSr: "Najpre popravite krov: novi pokrivač sa prepustom i padom ka nazad, zaptivene ivice.", detailEn: "First fix the roof: new covering with overhang and fall to the rear, sealed edges."});
      if (has("RAISED_BASE")) steps.push({id: "raise", titleSr: "2. Podignite kućicu od tla", titleEn: "2. Raise the house off the ground", detailSr: "Postavite kućicu na stabilne oslonce da pod ne stoji na vlažnoj zemlji.", detailEn: "Set the house on stable supports so the floor does not sit on wet ground."});
      if (has("ENTRANCE_FLAP") || has("WIND_BAFFLE")) steps.push({id: "wind", titleSr: "3. Zaštitite ulaz od vetra", titleEn: "3. Protect the entrance from wind", detailSr: "Okrenite ulaz od vetra, dodajte zavesu ili unutrašnju pregradu koja pravi L-ulaz.", detailEn: "Turn the entrance away from wind, add a flap or an interior baffle that forms an L-entry."});
      if (has("INTERIOR_INSULATION") || has("FLOOR_INSULATION")) steps.push({id: "insulate", titleSr: "4. Dodajte izolaciju", titleEn: "4. Add insulation", detailSr: "Ploče izolacije postavite uz unutrašnje zidove, krov i pod tek kada je kućica suva.", detailEn: "Fit insulation boards to the inner walls, roof and floor only once the house is dry."});
      if (has("PROTECTIVE_LINING")) steps.push({id: "line", titleSr: "5. Zaštitite izolaciju oblogom", titleEn: "5. Cover insulation with lining", detailSr: "Preko izolacije postavite oblogu tako da pas ne može da gricka penu.", detailEn: "Cover the insulation with lining so the dog cannot chew the foam."});
      if (has("SERVICE_ACCESS")) steps.push({id: "service", titleSr: "6. Omogućite servisni pristup", titleEn: "6. Provide service access", detailSr: "Ako je moguće, pretvorite krov u servisni sa šarkama i zatvaračem radi čišćenja.", detailEn: "If possible, convert the roof into a hinged, latched service roof for cleaning."});
      steps.push(beddingStep(model));
      break;
    }
    case "PANEL_BOX": {
      const shell = nm(p.shell.materialId);
      steps.push({id: "cut-shell", titleSr: "Isecite spoljne ploče", titleEn: "Cut the outer panels", detailSr: `Prema krojnoj listi isecite pod, zidove i krov od ${shell.sr} debljine ${mmText(p.shell.thicknessMm)}. Bočni zidovi su kosi: napred ${mmText(envelope.frontHeightMm)}, pozadi ${mmText(envelope.rearHeightMm)} ukupne visine, pa krov pada ka nazad.`, detailEn: `Following the cut list, cut the floor, walls and roof from ${mmText(p.shell.thicknessMm)} ${shell.en}. Side walls are sloped: ${mmText(envelope.frontHeightMm)} overall at the front and ${mmText(envelope.rearHeightMm)} at the rear, so the roof falls to the rear.`});
      steps.push(entranceStep(envelope, {sr: "prednji zid i sve unutrašnje slojeve", en: "the front wall and every inner layer"}));
      steps.push({id: "assemble", titleSr: "Sastavite kutiju", titleEn: "Assemble the box", detailSr: "Prednji i zadnji zid su pune širine, a bočni se uklapaju između njih. Spojite zidove na podu uz ugaone letve, lepak i šrafove kraće od debljine zida.", detailEn: "Front and rear walls run the full width and the sides fit between them. Join the walls on the floor with corner battens, glue and screws shorter than the wall build-up."});
      if (p.insulation) {
        const ins = nm(p.insulation.materialId);
        steps.push({id: "insulate", titleSr: "Postavite izolaciju", titleEn: "Fit the insulation", detailSr: `Ploče od ${ins.sr} postavite uz zidove${p.insulateFloor ? ", pod" : ""}${p.insulateRoof ? " i ispod krova" : ""}. Izolacija ne sme ostati izložena životinji.`, detailEn: `Fit ${ins.en} boards to the walls${p.insulateFloor ? ", floor" : ""}${p.insulateRoof ? " and under the roof" : ""}. Insulation must not stay exposed to the animal.`});
      }
      if (p.lining) {
        const lin = nm(p.lining.materialId);
        steps.push({id: "line", titleSr: "Unutrašnja obloga", titleEn: "Interior lining", detailSr: `Preko izolacije postavite oblogu od ${lin.sr}. Ivice oko ulaza zatvorite da se pena ne vidi.`, detailEn: `Cover the insulation with ${lin.en}. Close the edges around the entrance so no foam is visible.`});
      }
      if (p.chambers > 1) steps.push({id: "divider", titleSr: "Pregrade", titleEn: "Dividers", detailSr: `Postavite ${p.chambers - 1} pregradu između komora; svaka komora ima svoj ulaz.`, detailEn: `Fit ${p.chambers - 1} divider(s) between chambers; each chamber has its own entrance.`});
      steps.push({id: "roof", titleSr: p.serviceRoof ? "Servisni krov" : "Krov", titleEn: p.serviceRoof ? "Service roof" : "Roof", detailSr: `${p.serviceRoof ? "Pričvrstite krov šarkama na prednjoj ivici i zatvaračem pozadi, da se može otvoriti radi čišćenja. " : "Pričvrstite krov. "}${p.roofCoveringId ? "Postavite krovni pokrivač po uputstvu proizvoda, sa preklopima i zaštićenim ivicama." : "Krov bez pokrivača sme stajati samo pod nadstrešnicom."}`, detailEn: `${p.serviceRoof ? "Hinge the roof on its front edge and latch it at the rear so it opens for cleaning. " : "Fix the roof. "}${p.roofCoveringId ? "Fit the roof covering per the product instructions, with overlaps and protected edges." : "A roof without covering may only stand under cover."}`});
      steps.push({id: "finish", titleSr: "Zaštitite spolja", titleEn: "Protect the outside", detailSr: "Premažite spoljašnje površine i ivice zaštitnim premazom za drvo i ostavite da se potpuno osuši pre useljenja.", detailEn: "Coat outside faces and edges with a wood protection finish and let it fully cure before use."});
      steps.push(raiseStep(model, envelope.groundClearanceMm), beddingStep(model), placementStep(model));
      break;
    }
  }
  // Prefixed so step ids never collide with the engineered build-step copy overrides.
  return steps.map((step) => ({...step, id: `p-${step.id}`}));
}
