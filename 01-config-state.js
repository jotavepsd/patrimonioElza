// =========================================================
// CONFIGURAÇÃO DO FIREBASE
// =========================================================

var firebaseConfig = {
  apiKey: "AIzaSyC6UbTClmCouKf9GBR-nUjWfIsMk9qhPdM",
  authDomain: "controlepatrimonio-f26a4.firebaseapp.com",
  databaseURL: "https://controlepatrimonio-f26a4-default-rtdb.firebaseio.com",
  projectId: "controlepatrimonio-f26a4",
  storageBucket: "controlepatrimonio-f26a4.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);

var db = firebase.database();
var auth = firebase.auth();


// =========================================================
// USUÁRIO ATUAL
// =========================================================

var currentUser = null;


// =========================================================
// ADMINISTRADOR PRINCIPAL
// =========================================================
//
// Este UID é o usuário administrador que você acabou
// de cadastrar no Firebase Authentication.
//
// Depois podemos tirar isso do código e colocar a
// autorização definitivamente nas Security Rules.
//

var ADMIN_UIDS = [
  "zx87UQ8tzmMuYXksGWGA3B0eZ6k2"
];


// =========================================================
// DADOS DA APLICAÇÃO
// =========================================================

var dados = [];
var listaLocais = [];
var listaDescricoes = [];
var modo = 'local';
var abaAbertaRecentemente = null;
var editandoId = null;
var filtroStatus = 'todos';
var inventarioAtivo = false;
var inventarioLocal = '';
var inventarioItens = [];


// =========================================================
// DADOS PADRÃO
// =========================================================

var padraoLocais = [
  "Sala 01",
  "Sala 03",
  "Sala 04",
  "Sala 05",
  "Sala 06",
  "Sala 07",
  "Sala 08",
  "Sala 09",
  "Sala 10",
  "Sala 11",
  "Sala 12",
  "Sala 13",
  "Sala 14",
  "Secretaria",
  "Direção",
  "Depósito",
  "Biblioteca",
  "Coordenação",
  "Refeitório",
  "Sala de Atendimento",
  "Sala de Informática",
  "Sala do AEE",
  "Sala dos Professores",
  "Vice-Direção",
  "Cozinha dos Servidores",
  "Não localizado"
];

var padraoDescricoes = [
  "Conjunto de carteira",
  "Armário",
  "Ar Condicionado",
  "Cadeira",
  "Ventilador",
  "Mesa",
  "Headset",
  "WebCam",
  "Computador",
  "Monitor",
  "Roteador",
  "Impressora",
  "Geladeira",
  "Microondas",
  "Arquivo",
  "Prateleira",
  "TV",
  "Bebedouro",
  "Lousa Digital",
  "Plastificadora",
  "Switch",
  "Suporte"
];
