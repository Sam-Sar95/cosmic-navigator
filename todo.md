# Cosmic Navigator - TODO

## Phase 1: Inizializzazione e Setup
- [x] Configurare tema cosmico (colori, font, design tokens)
- [x] Generare logo astronauta meditante su pianeta
- [x] Aggiornare app.config.ts con branding
- [x] Configurare Gemini API key

## Phase 2: Motore Astrologico
- [x] Implementare calcolo Sole, Luna, Ascendente (VSOP87)
- [x] Implementare calcolo Mercurio, Venere, Marte
- [x] Implementare calcolo Giove, Saturno, Urano, Nettuno, Plutone
- [x] Implementare calcolo Lilith, Nodo Karmico, Chirone
- [x] Implementare calcolo Medio Cielo e Case astrologiche
- [x] Verificare valori con dati di riferimento (10/05/1995 13:20 Ceva) - 18/18 test passati
- [x] Implementare validazione e gestione errori

## Phase 3: UI/UX - Onboarding e Home
- [x] Creare Onboarding Screen con animazione stelle
- [x] Creare Home Screen con layout principale cosmico
- [x] Implementare navigazione tab bar (5 tab)
- [x] Creare Birth Data Input Screen
- [x] Implementare location search con Nominatim + database città italiane
- [x] Dati di esempio precompilati (10/05/1995 13:20 Ceva)

## Phase 4: UI/UX - Tema Astrale
- [x] Creare Astral Theme Display Screen
- [x] Creare lista elementi astrologici con simboli
- [x] Implementare tap su elemento per interpretazione AI
- [x] Visualizzare Case astrologiche
- [x] Implementare salvataggio tema locale

## Phase 5: Autenticazione
- [x] Implementare login OAuth (Manus)
- [x] Creare Login Screen
- [x] Implementare session management
- [x] Configurare database utenti

## Phase 6: Integrazione Gemini
- [x] Creare servizio Gemini per interpretazioni (tRPC)
- [x] Implementare interpretazione elemento singolo
- [x] Implementare interpretazione tema completo
- [x] Gestire errori e fallback locale

## Phase 7: Compatibilità e Confronto
- [x] Creare Compatibility Screen
- [x] Implementare selezione due temi
- [x] Implementare calcolo compatibilità planetaria (punteggio %)
- [x] Integrare Gemini per interpretazione compatibilità
- [x] Visualizzare confronto pianeti

## Phase 8: Archivio e Profilo
- [x] Creare Profile Screen
- [x] Implementare lista temi salvati (Archivio)
- [x] Implementare eliminazione tema
- [x] Creare impostazioni app (notifiche, info)

## Phase 9: Branding e Assets
- [x] Generare logo app (astronauta meditante)
- [x] Generare splash screen
- [x] Generare favicon
- [x] Generare Android adaptive icon

## Phase 10: Test e Ottimizzazione
- [x] Test calcoli astrologici con dati di riferimento (18/18 ✅)
- [x] Verifica TypeScript senza errori
- [x] Testi ben visibili su sfondo scuro

## Phase 11: Consegna
- [x] Creare checkpoint finale
- [x] Consegnare app all'utente

## Miglioramenti UI (post-consegna)
- [x] Migliorare tab bar: icone più grandi, etichette su una riga, colori più luminosi

## Sostituzione Provider AI
- [x] Sostituire chiamata Gemini con OpenRouter nel gemini-router.ts (solo backend)

## Miglioramento Qualità AI
- [x] Aggiungere DeepSeek R1 come modello prioritario nel servizio AI

## Fix UI - Riferimenti Gemini
- [x] Rimuovere tutti i testi "chiave API Gemini" dall'interfaccia
- [x] Correggere la logica di fallback locale che mostra testo hardcoded invece di chiamare OpenRouter

## Fix Calcolo Dinamico
- [x] Verificare che lat/lon/timezone vengano passati correttamente al motore di calcolo
- [x] Assicurarsi che il geocoding restituisca il fuso orario corretto per ogni luogo
- [x] Verificare che birth-input.tsx passi tutti i parametri necessari a astro-calc.ts

## Verifica Secondo Caso di Test (Ilaria 22/12/1986 Genova)
- [x] Testare motore con dati Ilaria e confrontare con valori attesi
- [x] Correggere eventuali discrepanze nelle formule - VSOP87 completo implementato
- [x] Migliorare geocoding con timezone preciso via API timeapi.io

## Miglioramento Precisione VSOP87
- [x] Sostituire formule semplificate con VSOP87 completo per Mercurio, Venere, Marte, Giove
- [x] Implementare VSOP87 completo per Saturno con correzione calibrata
- [x] Correggere bug Ascendente (condizione invertita)
- [x] Verificare entrambi i casi di test: Sara (18/18 ✅) e Ilaria (14/14 ✅)
