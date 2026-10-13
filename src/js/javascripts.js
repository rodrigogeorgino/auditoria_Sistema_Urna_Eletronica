  // --- SIMULADOR DE BANCO DE DADOS SQL (Client-Side com LocalStorage) ---
    class BrowserSQLDatabase {
      constructor() {
        this.storageKey = "db_eleicoes_2026_votos";
        this.init();
      }

      init() {
        console.log("%c[SQL DATABASE ENGINE INITIALIZED (Browser LocalStorage)]", "color: #1a73e8; font-weight: bold;");
        console.log("CREATE TABLE IF NOT EXISTS tb_votos (id INTEGER PRIMARY KEY AUTOINCREMENT, candidato_num VARCHAR(2), tipo_voto VARCHAR(20), timestamp_utf8 VARCHAR(35));");
        
        if (!localStorage.getItem(this.storageKey)) {
          localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        this.exibirRelatorioTotal();
      }

      obterVotos() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
      }

      inserirVoto(candidato_num, tipo_voto) {
        const votos = this.obterVotos();
        // Timestamp UTF-8 em formato ISO UTC exato
        const timestamp_utf8 = new Date().toISOString();
        
        const novoRegistro = {
          id: votos.length + 1,
          candidato_num: candidato_num || "N/A",
          tipo_voto: tipo_voto,
          timestamp_utf8: timestamp_utf8
        };

        votos.push(novoRegistro);
        localStorage.setItem(this.storageKey, JSON.stringify(votos));

        // Simula o comando SQL INSERT no console
        console.log(`%cINSERT INTO tb_votos (candidato_num, tipo_voto, timestamp_utf8) VALUES ('${novoRegistro.candidato_num}', '${novoRegistro.tipo_voto}', '${novoRegistro.timestamp_utf8}');`, "color: #2e7d32; font-weight: bold;");
        
        this.exibirRelatorioTotal();
      }

      exibirRelatorioTotal() {
        const votos = this.obterVotos();
        console.group("%c--- RELATÓRIO DE APURAÇÃO SQL (GROUP BY) ---", "color: #e5a33b; font-weight: bold;");
        console.log("QUERY: SELECT candidato_num, tipo_voto, COUNT(*) as total_votos FROM tb_votos GROUP BY candidato_num, tipo_voto;");

        const contagem = { "12": 0, "22": 0, "BRANCO": 0, "NULO": 0 };

        votos.forEach(v => {
          if (v.tipo_voto === "BRANCO") contagem["BRANCO"]++;
          else if (v.tipo_voto === "NULO") contagem["NULO"]++;
          else if (v.candidato_num === "12") contagem["12"]++;
          else if (v.candidato_num === "22") contagem["22"]++;
        });

        console.table([
          { "Candidato / Opção": "Candidato Alpha", "Número": "12", "Total Votos": contagem["12"] },
          { "Candidato / Opção": "Candidato Beta", "Número": "22", "Total Votos": contagem["22"] },
          { "Candidato / Opção": "Voto em Branco", "Número": "--", "Total Votos": contagem["BRANCO"] },
          { "Candidato / Opção": "Voto Nulo", "Número": "--", "Total Votos": contagem["NULO"] },
          { "Candidato / Opção": "TOTAL GERAL", "Número": "ALL", "Total Votos": votos.length }
        ]);

        console.groupEnd();
      }
    }

    const db = new BrowserSQLDatabase();

    // --- REGRAS DO 2º TURNO ---
    const CANDIDATOS_2TURNO = {
      "12": { nome: "Candidato Alpha", partido: "Partido 1" },
      "22": { nome: "Candidato Beta", partido: "Partido 2" }
    };

    let numero = "";
    let confirmado = false;
    let eBranco = false;

    const digits = document.getElementById("digits");
    const candidate = document.getElementById("candidate");
    const promptText = document.getElementById("prompt");
    const audio = document.getElementById("somConfirmacao");

    function renderizar() {
      digits.innerHTML = "";
      for (let i = 0; i < 2; i++) {
        const span = document.createElement("span");
        span.className = "digit";
        span.textContent = eBranco ? "" : (numero[i] || "");
        digits.appendChild(span);
      }
    }

    function digitar(d) {
      if (confirmado || eBranco || numero.length >= 2) return;
      numero += d;
      renderizar();

      if (numero.length === 2) {
        if (CANDIDATOS_2TURNO[numero]) {
          const cand = CANDIDATOS_2TURNO[numero];
          candidate.innerHTML = `<strong>NOME:</strong> ${cand.nome}<br><strong>PARTIDO:</strong> ${cand.partido}`;
        } else {
          candidate.textContent = "NÚMERO ERRADO — VOTO NULO";
        }
        promptText.textContent = "Confira seu voto e aperte CONFIRMA.";
      } else {
        candidate.textContent = "Digite o segundo algarismo.";
        promptText.textContent = "Aperte os números no teclado.";
      }
    }

    function corrigir() {
      numero = "";
      confirmado = false;
      eBranco = false;
      renderizar();
      candidate.textContent = "Digite 12 ou 22 para escolher seu candidato.";
      promptText.textContent = "Aperte os números no teclado.";
    }

    function votoBranco() {
      if (confirmado) return;
      numero = "";
      eBranco = true;
      renderizar();
      candidate.textContent = "VOTO EM BRANCO";
      promptText.textContent = "Aperte CONFIRMA para registrar o voto.";
    }

    function confirmar() {
      if (confirmado) return;

      let tipoVoto = "VÁLIDO";

      if (eBranco) {
        tipoVoto = "BRANCO";
      } else if (numero.length === 2) {
        if (!CANDIDATOS_2TURNO[numero]) {
          tipoVoto = "NULO";
        }
      } else {
        return; 
      }

      confirmado = true;

      // Gravação direta no cache estruturado estilo SQL no browser
      db.inserirVoto(numero, tipoVoto);

      candidate.textContent = "FIM — VOTO SALVO NO BANCO SQL!";
      promptText.textContent = "Próximo eleitor: pressione CORRIGE para reiniciar.";

      audio.currentTime = 0;
      audio.play().catch(() => {
        promptText.textContent = "Voto gravado no banco SQL! (Áudio não disponível).";
      });
    }
