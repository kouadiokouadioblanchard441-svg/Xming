import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "fr";

export const LANGUAGES: { code: Lang; label: string; flag: string; nativeName: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷", nativeName: "Français" },
];

export type Translations = {
  yourNumber: string;
  yourPassword: string;
  rememberMe: string;
  loginBtn: string;
  loginLoading: string;
  noAccount: string;
  createAccount: string;
  registerBtn: string;
  registerLoading: string;
  repeatPassword: string;
  referralCode: string;
  terms: string;
  errInvalidPhone: string;
  errPasswordRequired: string;
  errMinPassword: string;
  errConfirmPassword: string;
  errPasswordMismatch: string;
  errTransactionPasswordRequired: string;
  errInvitationCodeRequired: string;
  errTelegramRequired: string;
  errTelegramFormat: string;
  errTermsRequired: string;
  errLoginFailed: string;
  errRegisterFailed: string;
  successRegister: string;
  welcomeMsg: string;
  languageLabel: string;
  selectCountry: string;
  phonePlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  transactionPasswordPlaceholder: string;
  invitationCodePlaceholder: string;
  telegramPlaceholder: string;
  rememberPassword: string;
  loginImmediately: string;
  registerNow: string;
  noAccountRegister: string;
  alreadyHaveAccountLogin: string;
  home: string;
  products: string;
  earnings: string;
  team: string;
  me: string;
  deposit: string;
  withdraw: string;
  customerService: string;
  informationCenter: string;
  previous: string;
  next: string;
  notification: string;
  loading: string;
  noProducts: string;
  price: string;
  dailyRevenue: string;
  totalRevenue: string;
  duration: string;
  period: string;
  buy: string;
  purchased: string;
  purchaseSuccess: string;
  purchaseSuccessDescription: string;
  errorOccurred: string;
  accountBalance: string;
  revenue: string;
  adminPanel: string;
  adminAccessCode: string;
  adminPinHint: string;
  pinPlaceholder: string;
  confirm: string;
  cancel: string;
  history: string;
  security: string;
  redeem: string;
  about: string;
  wallet: string;
  commonFunctions: string;
  logout: string;
  // account suspended
  accountSuspended: string;
  accountSuspendedDesc: string;
  // change password page/modal
  back: string;
  changePassword: string;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  saving: string;
  processing: string;
  requiredFields: string;
  fillAllFields: string;
  passwordTooShort: string;
  minSixCharsRequired: string;
  passwordSuccess: string;
  passwordSuccessDesc: string;
  currentPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmNewPasswordPlaceholder: string;
  // history / empty states
  noWithdrawals: string;
  noTransactions: string;
  withdrawalHistory: string;
  // status labels
  statusApproved: string;
  statusPending: string;
  statusRejected: string;
  // withdrawal page
  invalidAmount: string;
  minAmountPrefix: string;
  addressRequired: string;
  selectUsdtWallet: string;
  // wallet form
  walletHolderName: string;
  walletHolderNamePlaceholder: string;
  walletAddressInvalid: string;
  walletHolderRequired: string;
  // deposit orders
  noDeposits: string;
  depositOrders: string;
  depositHistory: string;
  depositLabel: string;
  // members page
  membersTitle: string;
  membersLevel: string;
  membersTotalMembers: string;
  membersBonusReceived: string;
  membersNoneAtLevel: string;
  membersInviteFriends: string;
  membersBonus: string;
  // salary-bonus / task center page
  salaryPageTitle: string;
  salaryRewardLabel: string;
  salaryActiveMembers: string;
  salaryActiveMemberDef: string;
  salaryUnlocked: string;
  salaryClaimed: string;
  salaryMissing: string;
  salaryTotalRewards: string;
  salaryTotalPeople: string;
  salaryInviteDesc: string;
  salaryCurrent: string;
  salaryTarget: string;
  salaryProgress: string;
  salaryClaim: string;
  salaryInProgress: string;
  // tasks page toasts
  tasksRewardClaimed: string;
  tasksRewardClaimedDesc: string;
  tasksTierFallback: string;
  // my-products page
  myProductsTitle: string;
  myProductsDevice: string;
  myProductsEarnings: string;
  myProductsSettledEvery24h: string;
  myProductsNone: string;
  myProductsNoneDesc: string;
  myProductsDailyRevenue: string;
  myProductsEarned: string;
  myProductsDuration: string;
  myProductsDays: string;
  myProductsProgress: string;
  myProductsRevenueReceived: string;
  // rewards / gains page
  rewardsTitle: string;
  rewardsSubtitle: string;
  rewardsTaskList: string;
  rewardsRewardLabel: string;
  rewardsClaimed: string;
  rewardsClaim: string;
  rewardsReceived: string;
  rewardsSuccessTitle: string;
  rewardsSuccessDesc: string;
  // account balance labels
  accountBalanceLabel: string;
  revenueLabel: string;
  // deposit page
  depositAmount: string;
  depositMinimum: string;
  depositSelectNetwork: string;
  depositRechargeNow: string;
  depositNetworkTip: string;
  depositAddressTitle: string;
  depositExactAmount: string;
  depositGenerating: string;
  depositCopied: string;
  depositCopy: string;
  depositDone: string;
  depositDoneDesc: string;
  depositSecurity: string;
  depositSec1: string;
  depositSec3: string;
  depositCopiedToast: string;
  depositCopiedDesc: string;
  depositCopyFail: string;
  depositCopyFailDesc: string;
  depositCreateFail: string;
  depositModify: string;
  depositDefaultHelp: string;
  // home popup buttons
  popupOk: string;
  popupJoinGroup: string;
  // team page
  teamTitle: string;
  teamInviteSection: string;
  teamInviteCode: string;
  teamInviteLink: string;
  teamCopy: string;
  teamCodeCopied: string;
  teamLinkCopied: string;
  teamDepositsLabel: string;
  teamWithdrawalsLabel: string;
  teamLevel1: string;
  teamLevel2: string;
  teamLevel3: string;
  teamRechargeAmount: string;
  teamTotalCount: string;
  teamCommissionRate: string;
  teamViewAll: string;
  // tasks page
  taskTierBronze: string;
  taskTierSilver: string;
  taskTierGold: string;
  taskTierPlatinum: string;
  taskTierDiamond: string;
  taskTierElite: string;
  taskEarned: string;
  taskCompleted: string;
  taskClaimable: string;
  taskInviteDesc: string;
  taskDone: string;
  taskClaim: string;
  taskWaiting: string;
  taskNone: string;
  // orders page
  ordersOngoing: string;
  ordersCompleted: string;
  ordersNone: string;
  ordersStatusActive: string;
  ordersStatusDone: string;
  ordersDailyLbl: string;
  ordersCycleLbl: string;
  ordersDaysLbl: string;
  ordersRemainingLbl: string;
  ordersTotalEarnedLbl: string;
  ordersDateLbl: string;
  // invest page
  investConfirmDesc: string;
  investCycleDays: string;
  investInsufficient: string;
  investOnePerDay: string;
  // withdraw modal
  withdrawTitle: string;
  withdrawMinFee: string;
  withdrawNotAvailable: string;
  withdrawNeedDeposit: string;
  withdrawNeedProduct: string;
  withdrawNeedWallet: string;
  withdrawBlocked: string;
  withdrawMustInvite: string;
  withdrawAdminDisabled: string;
  withdrawWalletLabel: string;
  withdrawAvailableBalance: string;
  withdrawAmountLabel: string;
  withdrawMinPlaceholder: string;
  withdrawAmountRow: string;
  withdrawNetAmount: string;
  withdrawSubmitBtn: string;
  withdrawSuccess: string;
  withdrawSuccessDesc: string;
  // wallet modal
  walletTitle: string;
  walletDefault: string;
  walletNone: string;
  walletNameLabel: string;
  walletAddressLabel: string;
  walletNamePlaceholder: string;
  walletOnlyMethod: string;
  walletAddBtn: string;
  walletAdded: string;
  walletDeleted: string;
  walletDefaultUpdated: string;
  walletAddLabel: string;
  // service page
  serviceCustomerServiceFallback: string;
  serviceCustomerService2Fallback: string;
  serviceOfficialChannelFallback: string;
  serviceDiscussionGroupFallback: string;
  // deposit modal
  depositPaymentInfo: string;
  depositSubmitted: string;
  depositSubmittedDesc: string;
  depositCustomAmountPlaceholder: string;
  depositContinueBtn: string;
  depositChannelLabel: string;
  depositSelectChannel: string;
  depositAccountNameLabel: string;
  depositAccountNumberLabel: string;
  depositAccountNumberPlaceholder: string;
  depositPaymentMethodLabel: string;
  depositSelectOption: string;
  depositSubmitPayment: string;
  depositAmountLbl: string;
  depositMinDesc: string;
  // transaction history modal
  transactionHistoryTitle: string;
  transactionNetAmountLabel: string;
  // service modal
  serviceTitle: string;
  serviceOnlineConsult: string;
  serviceAnnouncements: string;
  serviceCommunity: string;
  // home
  companyLabel: string;
  // deposit-callback page
  depositSuccessTitle: string;
  depositSuccessDesc: string;
  depositRefLabel: string;
  depositViewHistory: string;
  depositGoHome: string;
  depositFailTitle: string;
  depositFailDesc: string;
  depositRetry: string;
  depositPendingTitle: string;
  depositPendingDesc: string;
  depositContactSupport: string;
  depositVerifyingTitle: string;
  depositVerifyingDesc: string;
  // withdrawal page
  withdrawalEarningsBalance: string;
  withdrawalAddressLabel: string;
  withdrawalSelectBep20: string;
  withdrawalAddWallet: string;
  withdrawalFeeLabel: string;
  withdrawalAmountPlaceholder: string;
  withdrawalNetAmountLabel: string;
  withdrawalMinimumNote: string;
  withdrawalSubmitting: string;
  // checkin
  checkinBtn: string;
  checkinComeBack: string;
  // account
  pinMinLength: string;
  // about modal
  aboutTitle: string;
  aboutDesc1: string;
  aboutDesc2: string;
  aboutSpecialties: string;
  aboutSpec1: string;
  aboutSpec2: string;
  aboutSpec3: string;
  aboutSpec4: string;
  aboutVersion: string;
  // products
  productNeedMore: string;
  // task center
  taskCenterTitle: string;
  // news
  articleNotFound: string;
  // spin wheel page
  wheelTitle: string;
  wheelMyAccount: string;
  wheelTotalRewardsLabel: string;
  wheelSpinsLeft: string;
  wheelNoSpins: string;
  wheelCongrats: string;
  wheelWonDesc: string;
  wheelErrUnavailable: string;
  wheelRulesBtn: string;
  wheelSaveBtn: string;
  wheelTickerWon: string;
  wheelTickerWonGrandPrize: string;
  wheelTickerWonSpecialBonus: string;
  wheelSegmentUnavailable: string;
  // wheel rules modal
  wheelRulesTitle: string;
  wheelRulesHowToGet: string;
  wheelRulesBuyGet: string;
  wheelRulesReferralGet: string;
  wheelRulesHowToPlay: string;
  wheelRulesHowToPlayDesc: string;
  wheelRulesSpinOnce: string;
  wheelRulesRewards: string;
  wheelRulesGainCredit: string;
  wheelRulesTokenNote: string;
  // wheel history modal
  wheelHistoryTitle: string;
  wheelHistoryEmpty: string;
  wheelHistoryNoGain: string;
  // history page
  historyTitle: string;
  historyTabDeposit: string;
  historyTabWithdrawal: string;
  withdrawalLabel: string;
  statusProcessing: string;
  status2FA: string;
  statusFailed: string;
  levelLabel: string;
  registeredOn: string;
  amountLabel: string;
  methodLabel: string;
  checkinBonusTitle: string;
  checkinBonusDesc: string;
  // banker page
  bankerTitle: string;
  bankerPendingDepositsLabel: string;
  bankerPendingWithdrawalsLabel: string;
  bankerDepositApproved: string;
  bankerDepositRejected: string;
  bankerWithdrawalApproved: string;
  bankerWithdrawalRejectedRefunded: string;
  bankerAll: string;
  bankerDepositsTab: string;
  bankerWithdrawalsTab: string;
  bankerHistoryTab: string;
  bankerNoHistory: string;
  depositProcessed: string;
  withdrawalProcessed: string;
  comingSoon: string;
  withdrawalCreated: string;
  withdrawalSubmitted: string;
  withdrawalCreatedDesc: string;
  withdrawalSubmittedDesc: string;
  searchPlaceholder: string;
  // wallet page extras
  walletAddCard: string;
  walletAddMethod: string;
  walletWithdrawalMethod: string;
  teamMembersLabel: string;
  statusLabel: string;
  dateLabel: string;
  notFoundTitle: string;
  notFoundDesc: string;
  searchCountryPlaceholder: string;
  incorrectPin: string;
  // team-details page
  teamHistoryTitle: string;
  teamMemberAccount: string;
  teamMemberDate: string;
  // gift-code page
  giftCodeLabel: string;
  giftCodeInputPlaceholder: string;
  giftCodeReceiveBtn: string;
  // wheel history extras
  wheelFirstSpinHint: string;
  wheelWinnersCount: string;
  wheelHistoryDividerLabel: string;
  // admin tab labels
  adminTabDashboard: string;
  adminTabDeposits: string;
  adminTabWithdrawals: string;
  adminTabUsers: string;
  adminTabProducts: string;
  adminTabNumbers: string;
  adminTabCountries: string;
  adminTabGiftCodes: string;
  adminTabSettings: string;
  adminTabTasks: string;
  adminTabWheel: string;
  adminTabContent: string;
  adminTabCompany: string;
  // ─── Team / Admin extended ─────────────────────────────────────────────────
  teamRegisteredOn: string;
  teamActiveProduct: string;
  teamDeposited: string;
  teamTotalInvested: string;
  teamPurchasedProducts: string;
  teamActiveStatus: string;
  teamEndedStatus: string;
  teamNoProductPurchased: string;
  teamLevel: string;
  teamMember: string;
  teamTotalTeamInvested: string;
  teamLevelShort: string;
  teamNoLevel1: string;
  teamNoLevel2: string;
  teamNoLevel3: string;
  teamUserNotFound: string;
  teamTeamOf: string;
  adminCancel: string;
  adminSave: string;
  adminCreate: string;
  adminConfirmDelete: string;
  adminSearchByPhoneOrName: string;
  adminSearchDeposit: string;
  adminChannelName: string;
  adminRedirectUrl: string;
  adminApiPayment: string;
  adminNoChannel: string;
  adminEditChannel: string;
  adminNewChannel: string;
  adminAutoMode: string;
  adminManualMode: string;
  adminManualModeActivated: string;
  adminAutoModeActivated: string;
  adminManualModeLabel: string;
  adminAutoModeLabel: string;
  adminManualModeDesc: string;
  adminAutoModeDesc: string;
  adminNoWithdrawals: string;
  adminManualPayment: string;
  adminUserActive: string;
  adminUserDeposited: string;
  adminUserTeamTitle: string;
  adminUserRegisteredOn: string;
  adminUserNotProvided: string;
  adminUserTransactionPwd: string;
  adminUserInvitedBy: string;
  adminUserReferralCode: string;
  adminEditBalance: string;
  adminNewBalance: string;
  adminEditEarnings: string;
  adminNewEarnings: string;
  adminResetPasswordLabel: string;
  adminNewPassword: string;
  adminAssignProduct: string;
  adminChooseProduct: string;
  adminUserProductsLabel: string;
  adminNoProduct: string;
  adminPinCode: string;
  adminTaskName: string;
  adminTaskNamePlaceholder: string;
  adminTaskDescriptionLabel: string;
  adminTaskDescriptionPlaceholder: string;
  adminTaskRequiredInvites: string;
  adminTaskReward: string;
  adminTaskSortOrder: string;
  adminTaskNew: string;
  adminTaskEdit: string;
  adminTaskActive: string;
  adminTaskInactive: string;
  adminTaskCreated: string;
  adminTaskUpdated: string;
  adminTaskDeleted: string;
  adminTaskDeleteWarning: string;
  adminTaskDelete: string;
  adminNoTasks: string;
  adminTaskCenterTitle: string;
  adminTaskCenterDesc: string;
  // Admin: channel toasts
  adminChannelCreated: string;
  adminChannelUpdated: string;
  adminChannelDeleted: string;
  // Admin: countries
  adminCountriesTitle: string;
  adminAddCountry: string;
  adminEditCountry: string;
  adminDeleteCountryTitle: string;
  adminCountryIrreversible: string;
  adminCountryActiveLabel: string;
  adminCountryCodeLabel: string;
  adminCountryCurrencyLabel: string;
  adminCountryNameLabel: string;
  adminCountryPhoneLabel: string;
  adminCountryOperatorsLabel: string;
  adminCountryOperatorsHint: string;
  adminCountryPhoneDisplay: string;
  adminCountryUpdated: string;
  adminCountryAdded: string;
  adminCountryDeleted: string;
  adminNoCountries: string;
  // Admin: company content
  adminCompanyDesc: string;
  adminCompanyAdd: string;
  adminCompanyEditBlock: string;
  adminCompanyNewBlock: string;
  adminCompanyBlockTitle: string;
  adminCompanyBlockTitlePlaceholder: string;
  adminCompanyBlockBody: string;
  adminCompanyBlockBodyPlaceholder: string;
  adminCompanyBlockImage: string;
  adminCompanyBlockImageOptional: string;
  adminCompanyBlockPreview: string;
  adminCompanyBlockImageRemove: string;
  adminCompanyBlockImageChange: string;
  adminCompanyBlockImageChoose: string;
  adminCompanyBlockImageUrlPlaceholder: string;
  adminCompanyBlockOrder: string;
  adminCompanyBlockVisible: string;
  adminCompanyBlockHidden: string;
  adminCompanyBlockNoText: string;
  adminCompanyEmpty: string;
  adminCompanyBlockModified: string;
  adminCompanyBlockAdded: string;
  adminCompanyBlockDeleted: string;
  adminCompanyBlockImageTooBig: string;
  adminCompanyBlockImageMaxSize: string;
  adminCompanyBlockDeletePrefix: string;
  adminCompanyBlockSave: string;
  // Admin: content editor
  adminContentDesc: string;
  adminContentSaved: string;
  adminContentSave: string;
  // Admin: wheel
  adminWheelTitle: string;
  adminWheelDesc: string;
  adminWheelSection: string;
  adminWheelCanWin: string;
  adminWheelCannotWin: string;
  adminWheelDisplayName: string;
  adminWheelDisplayNamePlaceholder: string;
  adminWheelAmount: string;
  adminWheelColor: string;
  adminWheelWarning: string;
  adminWheelSave: string;
  adminWheelSaved: string;
  adminWheelSaveError: string;
  // Admin: withdrawals extra
  adminWithdrawalAutoBtn: string;
  adminWithdrawalManualBtn: string;
  adminWithdrawalSearchPlaceholder: string;
  adminWithdrawal2FA: string;
  adminWithdrawal2FALabel: string;
  adminWithdrawal2FAFailed: string;
  adminWithdrawal2FAValidated: string;
  adminWithdrawal2FAProcessing: string;
  adminWithdrawalPayoutId: string;
  adminWithdrawalNowPaymentsId: string;
  adminWithdrawalNowPaymentsValidated: string;
  adminWithdrawalNowPaymentsValidatedDesc: string;
  adminWithdrawalNowPaymentsFailed: string;
  adminWithdrawalServerError: string;
  adminWithdrawalAt: string;
  // Admin: settings
  adminSettingsSaved: string;
  adminSettingsGoOnline: string;
  adminSettingsGoOffline: string;
  adminSettingsMaintenanceMode: string;
  adminSettingsMaintenanceActive: string;
  adminSettingsRunning: string;
  // Admin action labels used in deposits/withdrawals/banker panels
  approve: string;
  reject: string;
  rejectAndBan: string;
  amount: string;
  operator: string;
  payerNumber: string;
  date: string;
  recipientNumber: string;
  reference: string;
  paymentMessageReceived: string;
  screenshot: string;
  grossAmount: string;
  netAmount: string;
  fees: string;
  method: string;
  bep20Address: string;
  dateTime: string;
  enter2FACode: string;
  promoter: string;
  channel: string;
  beneficiary: string;
  country: string;
};

const T: Record<Lang, Translations> = {
  fr: {
    yourNumber:         "votre numéro",
    yourPassword:       "votre mot de passe",
    rememberMe:         "se souvenir de moi",
    loginBtn:           "Se connecter",
    loginLoading:       "Connexion...",
    noAccount:          "Je n'ai pas de compte.",
    createAccount:      "Créer un compte",
    registerBtn:        "S'inscrire",
    registerLoading:    "Inscription...",
    repeatPassword:     "répéter le mot de passe",
    referralCode:       "code de parrainage",
    terms:              "En cochant cette case, vous acceptez les Conditions Générales d'Utilisation de ASUS",
    errInvalidPhone:    "Numéro de téléphone invalide",
    errPasswordRequired:"Le mot de passe est requis",
    errMinPassword:     "Au moins 6 caractères",
    errConfirmPassword: "Confirmez le mot de passe",
    errPasswordMismatch:"Les mots de passe ne correspondent pas",
    errTransactionPasswordRequired: "Le mot de passe de transaction est obligatoire",
    errInvitationCodeRequired: "Le code d'invitation est obligatoire",
    errTelegramRequired: "Le compte Telegram est obligatoire",
    errTelegramFormat: "Le compte Telegram doit commencer par @",
    errTermsRequired:   "Veuillez accepter les conditions d'utilisation",
    errLoginFailed:     "Vérifiez vos informations",
    errRegisterFailed:  "Une erreur est survenue",
    successRegister:    "Inscription réussie !",
    welcomeMsg:         "Bienvenue sur ASUS !",
    languageLabel:      "Langue",
    selectCountry:      "Sélectionnez un pays",
    phonePlaceholder:   "Veuillez saisir votre numéro de téléphone",
    passwordPlaceholder:"Veuillez saisir votre mot de passe",
    confirmPasswordPlaceholder: "Veuillez confirmer votre mot de passe",
    transactionPasswordPlaceholder: "Veuillez saisir votre mot de passe de transaction",
    invitationCodePlaceholder: "Veuillez saisir le code d'invitation",
    telegramPlaceholder:"Telegram",
    rememberPassword:   "Mémoriser le mot de passe",
    loginImmediately:   "Se connecter",
    registerNow:        "S'inscrire maintenant",
    noAccountRegister:  "Pas de compte ? S'inscrire",
    alreadyHaveAccountLogin: "Déjà un compte ? Se connecter",
    home:               "Accueil",
    products:           "Produits",
    earnings:           "Gains",
    team:               "Équipe",
    me:                 "Moi",
    deposit:            "Recharger",
    withdraw:           "Retirer",
    customerService:    "Service client",
    informationCenter:  "Centre d'information",
    previous:           "Précédent",
    next:               "Suivant",
    notification:       "Notification",
    loading:            "Chargement...",
    noProducts:         "Aucun produit disponible",
    price:              "Prix",
    dailyRevenue:       "Revenu quotidien",
    totalRevenue:       "Revenu total",
    duration:           "Durée",
    period:             "Période",
    buy:                "Acheter",
    purchased:          "Acheté",
    purchaseSuccess:    "Produit acheté !",
    purchaseSuccessDescription: "Vous commencerez à recevoir des gains demain.",
    errorOccurred:      "Une erreur est survenue",
    accountBalance:     "Solde du compte",
    revenue:            "Revenus",
    adminPanel:         "Panel Admin",
    adminAccessCode:    "Code d'accès administrateur",
    adminPinHint:       "Entrez votre code PIN pour accéder au panel administrateur",
    pinPlaceholder:     "Code PIN",
    confirm:            "Confirmer",
    cancel:             "Annuler",
    history:            "Historique",
    security:           "Sécurité",
    redeem:             "Échanger",
    about:              "À propos",
    wallet:             "Portefeuille",
    commonFunctions:    "Fonctions communes",
    logout:             "Déconnexion",
    accountSuspended:   "Compte suspendu",
    accountSuspendedDesc: "Votre compte a été suspendu. Contactez le support.",
    back:               "Retour",
    changePassword:     "Changer le mot de passe",
    oldPassword:        "Ancien mot de passe",
    newPassword:        "Nouveau mot de passe",
    confirmNewPassword: "Re-mot de passe",
    saving:             "Enregistrement...",
    processing:         "Modification...",
    requiredFields:     "Champs requis",
    fillAllFields:      "Veuillez remplir tous les champs",
    passwordTooShort:   "Mot de passe trop court",
    minSixCharsRequired:"Minimum 6 caractères requis",
    passwordSuccess:    "Succès",
    passwordSuccessDesc:"Mot de passe modifié avec succès",
    currentPasswordPlaceholder: "Mot de passe actuel",
    newPasswordPlaceholder:     "Nouveau mot de passe",
    confirmNewPasswordPlaceholder: "Confirmer le nouveau mot de passe",
    noWithdrawals:      "Aucun retrait pour le moment",
    noTransactions:     "Aucune transaction pour le moment",
    withdrawalHistory:  "Historique des retraits",
    statusApproved:     "SUCCÈS",
    statusPending:      "EN ATTENTE",
    statusRejected:     "REFUSÉ",
    invalidAmount:      "Montant invalide",
    minAmountPrefix:    "Le montant minimum est de",
    addressRequired:    "Adresse requise",
    selectUsdtWallet:   "Veuillez sélectionner une adresse USDT BEP20",
    walletHolderName:   "Nom du titulaire",
    walletHolderNamePlaceholder: "Entrez le nom du titulaire",
    walletAddressInvalid: "Adresse BEP20 invalide (format 0x + 40 caractères)",
    walletHolderRequired: "Nom du titulaire requis",
    noDeposits:         "Aucun dépôt pour le moment",
    depositOrders:      "Ordre du dépôt",
    depositHistory:     "Historique des dépôts",
    depositLabel:       "DÉPÔT",
    depositAmount:      "Montant de la recharge",
    depositMinimum:     "Minimum",
    depositSelectNetwork: "Sélectionnez le réseau de paiement",
    depositRechargeNow: "Rechargez maintenant",
    depositNetworkTip:  "Choisissez ensuite le réseau exact utilisé par votre portefeuille avant d'envoyer les fonds.",
    depositAddressTitle:"Adresse de dépôt",
    depositExactAmount: "Montant exact à envoyer",
    depositGenerating:  "Génération de votre adresse…",
    depositCopied:      "Copié",
    depositCopy:        "Copier",
    depositDone:        "Dépôt effectué",
    depositDoneDesc:    "Votre dépôt sera crédité après confirmation du paiement.",
    depositSecurity:    "Instructions de sécurité",
    depositSec1:        "1. Copiez l'adresse ci-dessus ou scannez le QR code.",
    depositSec3:        "3. Le solde sera crédité après la confirmation de la transaction par le réseau.",
    depositCopiedToast: "Adresse copiée",
    depositCopiedDesc:  "L'adresse de dépôt est dans votre presse-papiers.",
    depositCopyFail:    "Copie impossible",
    depositCopyFailDesc:"Maintenez l'adresse appuyée pour la copier.",
    depositCreateFail:  "Impossible de créer le dépôt",
    depositModify:      "Modifier",
    depositDefaultHelp: "Envoyez uniquement la devise et le réseau sélectionnés vers l'adresse affichée. Un mauvais réseau peut entraîner la perte des fonds.",
    popupOk:            "OK",
    popupJoinGroup:     "Rejoindre le groupe Telegram >",
    teamTitle:          "Équipe",
    teamInviteSection:  "Code et lien d'invitation",
    teamInviteCode:     "Code d'invitation :",
    teamInviteLink:     "Lien d'invitation :",
    teamCopy:           "Copier",
    teamCodeCopied:     "Code d'invitation copié !",
    teamLinkCopied:     "Lien copié !",
    teamDepositsLabel:  "Total recharges équipe",
    teamWithdrawalsLabel:"Total retraits équipe",
    teamLevel1:         "Équipe Niveau 1",
    teamLevel2:         "Équipe Niveau 2",
    teamLevel3:         "Équipe Niveau 3",
    teamRechargeAmount: "Montant rechargé",
    teamTotalCount:     "Total membres",
    teamCommissionRate: "Taux de commission",
    teamViewAll:        "Voir tous les membres",
    taskTierBronze:     "Référence Bronze",
    taskTierSilver:     "Référence Argent",
    taskTierGold:       "Référence Or",
    taskTierPlatinum:   "Référence Platine",
    taskTierDiamond:    "Référence Diamant",
    taskTierElite:      "Référence Élite",
    taskEarned:         "Gagné",
    taskCompleted:      "Terminé",
    taskClaimable:      "À réclamer",
    taskInviteDesc:     "Inviter {0} personnes ayant rechargé",
    taskDone:           "✓ Terminé",
    taskClaim:          "Réclamer",
    taskWaiting:        "En attente",
    taskNone:           "Aucune tâche disponible",
    ordersOngoing:      "En cours",
    ordersCompleted:    "Terminé",
    ordersNone:         "Aucune commande",
    ordersStatusActive: "Actif",
    ordersStatusDone:   "Terminé",
    ordersDailyLbl:     "Revenus quotidiens",
    ordersCycleLbl:     "Cycle",
    ordersDaysLbl:      "jours",
    ordersRemainingLbl: "Jours restants",
    ordersTotalEarnedLbl:"Gains cumulés",
    ordersDateLbl:      "Date",
    investConfirmDesc:  "Après l'achat, les revenus seront crédités toutes les 24h.",
    investCycleDays:    "Cycle valide",
    investInsufficient: "Solde insuffisant, il manque {0}.",
    investOnePerDay:    "Une seule commande par personne par jour.",
    withdrawTitle:      "Retrait",
    withdrawMinFee:     "Montant min : {0} USDT | Frais : {1}%",
    withdrawNotAvailable:"Retrait temporairement indisponible",
    withdrawNeedDeposit:"Veuillez d'abord recharger",
    withdrawNeedProduct:"Veuillez d'abord acheter un produit",
    withdrawNeedWallet: "Veuillez enregistrer un portefeuille",
    withdrawBlocked:    "Votre fonction de retrait a été bloquée",
    withdrawMustInvite: "Veuillez inviter un utilisateur à investir",
    withdrawAdminDisabled:"L'administrateur a désactivé les retraits",
    withdrawWalletLabel:"Portefeuille de retrait",
    withdrawAvailableBalance:"Solde disponible",
    withdrawAmountLabel:"Montant du retrait",
    withdrawMinPlaceholder:"Minimum {0}",
    withdrawAmountRow:  "Montant",
    withdrawNetAmount:  "Montant net",
    withdrawSubmitBtn:  "Demander retrait",
    withdrawSuccess:    "Demande de retrait soumise !",
    withdrawSuccessDesc:"Votre retrait est en cours de traitement.",
    walletTitle:        "Gestion du portefeuille",
    walletDefault:      "Défaut",
    walletNone:         "Aucun portefeuille enregistré",
    walletNameLabel:    "Nom du compte",
    walletAddressLabel: "Adresse BEP20",
    walletNamePlaceholder:"Entrez votre nom",
    walletOnlyMethod:   "Méthode unique",
    walletAddBtn:       "Ajouter un portefeuille",
    walletAdded:        "Portefeuille ajouté !",
    walletDeleted:      "Portefeuille supprimé !",
    walletDefaultUpdated:"Portefeuille par défaut mis à jour !",
    walletAddLabel:     "Ajouter",
    serviceCustomerServiceFallback: "Service client",
    serviceCustomerService2Fallback:"Service client 2",
    serviceOfficialChannelFallback: "Chaîne officielle",
    serviceDiscussionGroupFallback: "Groupe de discussion",
    membersTitle:        "Mes Membres",
    membersLevel:        "Niveau",
    membersTotalMembers: "Total membres",
    membersBonusReceived:"Bonus reçus",
    membersNoneAtLevel:  "Aucun membre au niveau {0}",
    membersInviteFriends:"Invitez des amis pour agrandir votre équipe",
    membersBonus:        "Bonus",
    salaryPageTitle:        "Récompenses de parrainage",
    salaryRewardLabel:      "Récompense",
    salaryActiveMembers:    "Membres actifs",
    salaryActiveMemberDef:  "Filleul direct ayant acheté au minimum VIP 1",
    salaryUnlocked:         "Débloquée",
    salaryClaimed:          "Réclamée ✓",
    salaryMissing:          "Il vous manque {0} membres actifs",
    salaryTotalRewards: "Total des récompenses",
    salaryTotalPeople:  "Total de personnes",
    salaryInviteDesc:   "Invitez {0} investisseurs de niveau 1 pour obtenir :",
    salaryCurrent:      "Actuel",
    salaryTarget:       "Objectif",
    salaryProgress:     "Progression",
    salaryClaim:        "Réclamer",
    salaryInProgress:   "En cours",
    tasksRewardClaimed: "Récompense réclamée !",
    tasksRewardClaimedDesc: "Le bonus a été ajouté à votre compte.",
    tasksTierFallback:  "Palier",
    myProductsTitle:    "Mes Produits",
    myProductsDevice:   "Mon appareil",
    myProductsEarnings: "Mes revenus",
    myProductsSettledEvery24h: "⏱️ Les revenus des produits sont réglés toutes les 24 heures",
    myProductsNone:     "Aucun produit ASUS",
    myProductsNoneDesc: "Achetez des produits pour commencer à gagner",
    myProductsDailyRevenue: "Revenu/jour",
    myProductsEarned:   "Gagné",
    myProductsDuration: "Durée",
    myProductsDays:     "jours",
    myProductsProgress: "Progression",
    myProductsRevenueReceived: "Revenus reçus",
    rewardsTitle:       "Recevoir",
    rewardsSubtitle:    "Remplissez ces tâches pour obtenir {0} {1}",
    rewardsTaskList:    "Liste des tâches",
    rewardsRewardLabel: "Récompense",
    rewardsClaimed:     "Complet",
    rewardsClaim:       "Recevoir",
    rewardsReceived:    "Reçu",
    rewardsSuccessTitle:"Félicitations",
    rewardsSuccessDesc: "Récompense reçue avec succès !",
    accountBalanceLabel:"Solde du compte",
    revenueLabel:       "Revenus",
    depositPaymentInfo: "Informations de paiement",
    depositSubmitted:   "Recharge soumise !",
    depositSubmittedDesc: "Votre recharge est en attente de validation.",
    depositCustomAmountPlaceholder: "Montant personnalisé",
    depositContinueBtn: "Continuer",
    depositChannelLabel: "Canal de recharge",
    depositSelectChannel: "Choisir un canal",
    depositAccountNameLabel: "Nom du compte de paiement",
    depositAccountNumberLabel: "Numéro de paiement",
    depositAccountNumberPlaceholder: "Entrez le numéro",
    depositPaymentMethodLabel: "Mode de paiement",
    depositSelectOption: "Sélectionner",
    depositSubmitPayment: "Soumettre le paiement",
    depositAmountLbl:   "Montant",
    depositMinDesc:     "Montant minimum :",
    transactionHistoryTitle: "Historique des transactions",
    transactionNetAmountLabel: "Reçu :",
    serviceTitle:       "Service client",
    serviceOnlineConsult: "Consultation en ligne",
    serviceAnnouncements: "Annonces et actualités",
    serviceCommunity:   "Échanger avec les membres",
    companyLabel:       "Entreprise",
    depositSuccessTitle: "Recharge réussie !",
    depositSuccessDesc: "Votre solde a bien été crédité.",
    depositRefLabel:    "Référence :",
    depositViewHistory: "Voir l'historique des recharges",
    depositGoHome:      "Retour à l'accueil",
    depositFailTitle:   "Paiement échoué",
    depositFailDesc:    "Votre paiement n'a pas pu être traité. Aucun montant n'a été débité.",
    depositRetry:       "Réessayer",
    depositPendingTitle: "En attente de confirmation",
    depositPendingDesc: "Votre paiement est en cours de traitement. Si votre solde n'est pas crédité dans 10 minutes, contactez le support avec votre numéro de référence.",
    depositContactSupport: "Contacter le support",
    depositVerifyingTitle: "Vérification en cours…",
    depositVerifyingDesc: "Confirmation de votre paiement en cours, veuillez patienter.",
    withdrawalEarningsBalance: "Solde des gains",
    withdrawalAddressLabel: "Adresse de retrait",
    withdrawalSelectBep20: "Sélectionner une adresse BEP20",
    withdrawalAddWallet: "Ajouter un portefeuille de retrait",
    withdrawalFeeLabel: "Frais :",
    withdrawalAmountPlaceholder: "Entrez le montant du retrait",
    withdrawalNetAmountLabel: "Montant reçu :",
    withdrawalMinimumNote: "(Min. {0} {1})",
    withdrawalSubmitting: "Envoi en cours...",
    checkinBtn:         "Pointer",
    checkinComeBack:    "Revenez dans {0} heures",
    pinMinLength:       "Entrez au moins 4 caractères pour le PIN",
    aboutTitle:         "À propos de ASUS",
    aboutDesc1:         "ASUS est une plateforme d'investissement sécurisée qui vous permet de faire fructifier votre capital grâce à des produits VIP générateurs de revenus quotidiens.",
    aboutDesc2:         "Notre mission : offrir des opportunités d'investissement accessibles et transparentes à tous, avec un support disponible 7j/7.",
    aboutSpecialties:   "Ce que nous offrons :",
    aboutSpec1:         "- Revenus quotidiens automatiques",
    aboutSpec2:         "- Retraits via Mobile Money",
    aboutSpec3:         "- Programme de parrainage rémunérateur",
    aboutSpec4:         "- Support client disponible 7j/7",
    aboutVersion:       "Version 1.0.0 - Tous droits réservés",
    productNeedMore:    "Il manque {0} pour acheter ce produit.",
    taskCenterTitle:    "Centre de tâches",
    articleNotFound:    "Article introuvable",
    wheelTitle:         "Tirage Au Sort",
    wheelMyAccount:     "Mon Compte",
    wheelTotalRewardsLabel: "Récompenses Totales :",
    wheelSpinsLeft:     "Tours restants : {0}",
    wheelNoSpins:       "Aucun tour disponible",
    wheelCongrats:      "🎉 Félicitations !",
    wheelWonDesc:       "Vous avez gagné : {0} FCFA",
    wheelErrUnavailable:"Le tirage est indisponible",
    wheelRulesBtn:      "Règles",
    wheelSaveBtn:       "Historique",
    wheelTickerWon:             "{0} a gagné {1} FCFA",
    wheelTickerWonGrandPrize:   "{0} a gagné le grand prix",
    wheelTickerWonSpecialBonus: "{0} a gagné un bonus spécial",
    wheelSegmentUnavailable:    "indisponible",
    wheelRulesTitle:    "Règles du Tirage",
    wheelRulesHowToGet: "Comment obtenir des tours",
    wheelRulesBuyGet:   "Achetez un produit payant → 1 tour crédité immédiatement",
    wheelRulesReferralGet: "Un filleul direct investit → 1 tour crédité sur votre compte",
    wheelRulesHowToPlay:"Comment jouer",
    wheelRulesHowToPlayDesc: "Appuyez sur la roue pour lancer le tirage",
    wheelRulesSpinOnce: "1 tour consommé par tirage",
    wheelRulesRewards:  "Les gains",
    wheelRulesGainCredit: "Chaque gain est crédité sur votre solde de retrait",
    wheelRulesTokenNote: "Vos tours ne expirent jamais",
    wheelHistoryTitle:  "Historique des tirages",
    wheelHistoryEmpty:  "Aucun tirage pour le moment",
    wheelHistoryNoGain: "Pas de gain",
    historyTitle:       "Détails",
    historyTabDeposit:  "Recharger",
    historyTabWithdrawal: "Retirer",
    withdrawalLabel:    "RETRAIT",
    statusProcessing:   "En cours",
    status2FA:          "En cours de traitement",
    statusFailed:       "Échoué — remboursé",
    levelLabel:         "Niveau",
    registeredOn:       "Inscrit le",
    amountLabel:        "Montant",
    methodLabel:        "Méthode",
    checkinBonusTitle:  "Bonus reçu !",
    checkinBonusDesc:   "Bonus quotidien ajouté à votre solde",
    bankerTitle:            "Espace Bankier",
    bankerPendingDepositsLabel: "Dépôts en attente",
    bankerPendingWithdrawalsLabel: "Retraits en attente",
    bankerDepositApproved:  "Dépôt validé !",
    bankerDepositRejected:  "Dépôt rejeté",
    bankerWithdrawalApproved: "Retrait approuvé !",
    bankerWithdrawalRejectedRefunded: "Retrait rejeté et remboursé",
    bankerAll:              "Tous",
    bankerDepositsTab:      "Dépôts",
    bankerWithdrawalsTab:   "Retraits",
    bankerHistoryTab:       "Historique",
    bankerNoHistory:        "Aucun historique trouvé",
    depositProcessed:       "Dépôt traité !",
    withdrawalProcessed:    "Retrait traité !",
    comingSoon:             "Bientôt disponible.",
    withdrawalCreated:      "Retrait créé",
    withdrawalSubmitted:    "Demande envoyée",
    withdrawalCreatedDesc:  "Votre demande de retrait a été soumise et est en cours de traitement.",
    withdrawalSubmittedDesc:"Votre demande de retrait a été envoyée.",
    searchPlaceholder:      "Rechercher nom, téléphone, référence...",
    walletAddCard:          "Ajouter une carte",
    walletAddMethod:            "Ajouter un moyen de retrait",
    walletWithdrawalMethod:     "Moyen de retrait",
    teamMembersLabel:           "Membres de l'équipe",
    statusLabel:                "État",
    dateLabel:                  "Date",
    notFoundTitle:              "404 Page introuvable",
    notFoundDesc:               "Cette page n'existe pas.",
    searchCountryPlaceholder:   "Rechercher un pays ou indicatif…",
    incorrectPin:               "Code PIN incorrect",
    teamHistoryTitle:       "Historique d'équipe",
    teamMemberAccount:      "Compte :",
    teamMemberDate:         "Date :",
    giftCodeLabel:          "Code cadeau",
    giftCodeInputPlaceholder: "Saisir le code ici",
    giftCodeReceiveBtn:     "Recevoir ma récompense",
    wheelFirstSpinHint:     "Faites votre premier tirage pour voir vos résultats ici.",
    wheelWinnersCount:      "{0} gagnants",
    wheelHistoryDividerLabel: "Historique des tirages",
    adminTabDashboard:      "Tableau de bord",
    adminTabDeposits:       "Dépôts",
    adminTabWithdrawals:    "Retraits",
    adminTabUsers:          "Utilisateurs",
    adminTabProducts:       "Produits",
    adminTabNumbers:        "Numéros",
    adminTabCountries:      "Pays",
    adminTabGiftCodes:      "Codes Cadeaux",
    adminTabSettings:       "Paramètres",
    adminTabTasks:          "Tâches",
    adminTabWheel:          "Roue",
    adminTabContent:        "Contenu",
    adminTabCompany:        "Compagnie",
    teamRegisteredOn: "Date d'inscription",
    teamActiveProduct: "Produit actif",
    teamDeposited: "Déposé",
    teamTotalInvested: "Total investi",
    teamPurchasedProducts: "Produits achetés",
    teamActiveStatus: "Actif",
    teamEndedStatus: "Terminé",
    teamNoProductPurchased: "Aucun produit",
    teamLevel: "Niveau",
    teamMember: "Membre",
    teamTotalTeamInvested: "Total investi par l'équipe",
    teamLevelShort: "Nv.",
    teamNoLevel1: "Aucun membre niveau 1",
    teamNoLevel2: "Aucun membre niveau 2",
    teamNoLevel3: "Aucun membre niveau 3",
    teamUserNotFound: "Utilisateur introuvable",
    teamTeamOf: "Équipe de",
    adminCancel: "Annuler",
    adminSave: "Enregistrer",
    adminCreate: "Créer",
    adminConfirmDelete: "Confirmer la suppression",
    adminSearchByPhoneOrName: "Rechercher par téléphone ou nom...",
    adminSearchDeposit: "Rechercher un dépôt...",
    adminChannelName: "Nom du canal",
    adminRedirectUrl: "URL de redirection",
    adminApiPayment: "Paiement API automatique",
    adminNoChannel: "Aucun canal configuré",
    adminEditChannel: "Modifier le canal",
    adminNewChannel: "Nouveau canal",
    adminAutoMode: "Mode Automatique",
    adminManualMode: "Mode Manuel",
    adminManualModeActivated: "✋ Mode Manuel activé",
    adminAutoModeActivated: "⚡ Mode Automatique activé",
    adminManualModeLabel: "Mode Manuel",
    adminAutoModeLabel: "Mode Automatique",
    adminManualModeDesc: "Vous validez chaque retrait manuellement",
    adminAutoModeDesc: "NOWPayments traite automatiquement + code 2FA",
    adminNoWithdrawals: "Aucun retrait trouvé",
    adminManualPayment: "Paiement manuel",
    adminUserActive: "Actif",
    adminUserDeposited: "A déposé",
    adminUserTeamTitle: "Équipe",
    adminUserRegisteredOn: "Inscrit le",
    adminUserNotProvided: "Non renseigné",
    adminUserTransactionPwd: "Mot de passe transaction",
    adminUserInvitedBy: "Parrainé par",
    adminUserReferralCode: "Code de parrainage",
    adminEditBalance: "Modifier le solde",
    adminNewBalance: "Nouveau solde",
    adminEditEarnings: "Modifier les gains",
    adminNewEarnings: "Nouveaux gains",
    adminResetPasswordLabel: "Réinitialiser le mot de passe",
    adminNewPassword: "Nouveau mot de passe",
    adminAssignProduct: "Attribuer un produit",
    adminChooseProduct: "Choisir un produit",
    adminUserProductsLabel: "Produits de l'utilisateur",
    adminNoProduct: "Aucun produit",
    adminPinCode: "Code PIN",
    adminTaskName: "Nom de la tâche",
    adminTaskNamePlaceholder: "Entrez le nom de la tâche...",
    adminTaskDescriptionLabel: "Description",
    adminTaskDescriptionPlaceholder: "Entrez la description...",
    adminTaskRequiredInvites: "Invitations requises",
    adminTaskReward: "Récompense",
    adminTaskSortOrder: "Ordre",
    adminTaskNew: "Nouvelle tâche",
    adminTaskEdit: "Modifier la tâche",
    adminTaskActive: "Actif",
    adminTaskInactive: "Inactif",
    adminTaskCreated: "Tâche créée",
    adminTaskUpdated: "Tâche mise à jour",
    adminTaskDeleted: "Tâche supprimée",
    adminTaskDeleteWarning: "Cette action est irréversible.",
    adminTaskDelete: "Supprimer",
    adminNoTasks: "Aucune tâche",
    adminTaskCenterTitle: "Centre des tâches",
    adminTaskCenterDesc: "Gérer les tâches et récompenses",
    adminChannelCreated: "Canal créé !",
    adminChannelUpdated: "Canal mis à jour !",
    adminChannelDeleted: "Canal supprimé !",
    adminCountriesTitle: "Gestion des Pays",
    adminAddCountry: "Ajouter un pays",
    adminEditCountry: "Modifier le pays",
    adminDeleteCountryTitle: "Supprimer ce pays ?",
    adminCountryIrreversible: "Cette action est irréversible.",
    adminCountryActiveLabel: "Pays actif",
    adminCountryCodeLabel: "Code pays (ex: CM)",
    adminCountryCurrencyLabel: "Devise (ex: USDT)",
    adminCountryNameLabel: "Nom du pays",
    adminCountryPhoneLabel: "Indicatif téléphonique (sans +)",
    adminCountryOperatorsLabel: "Opérateurs (séparés par virgule)",
    adminCountryOperatorsHint: "Exemple: Airtel Money, Moov Money",
    adminCountryPhoneDisplay: "Indicatif: +",
    adminCountryUpdated: "Pays mis à jour !",
    adminCountryAdded: "Pays ajouté !",
    adminCountryDeleted: "Pays supprimé !",
    adminNoCountries: "Aucun pays configuré",
    adminCompanyDesc: "Ajoutez les informations de l'entreprise, les plans et les images.",
    adminCompanyAdd: "Ajouter",
    adminCompanyEditBlock: "Modifier le bloc",
    adminCompanyNewBlock: "Nouveau bloc",
    adminCompanyBlockTitle: "Titre",
    adminCompanyBlockTitlePlaceholder: "Ex. Notre entreprise",
    adminCompanyBlockBody: "Texte",
    adminCompanyBlockBodyPlaceholder: "Présentez l'entreprise...",
    adminCompanyBlockImage: "Image",
    adminCompanyBlockImageOptional: "(optionnelle)",
    adminCompanyBlockPreview: "Aperçu",
    adminCompanyBlockImageRemove: "Supprimer l'image",
    adminCompanyBlockImageChange: "Changer l'image",
    adminCompanyBlockImageChoose: "Choisir une image",
    adminCompanyBlockImageUrlPlaceholder: "Ou coller une URL https://...",
    adminCompanyBlockOrder: "Ordre d'affichage",
    adminCompanyBlockVisible: "Visible",
    adminCompanyBlockHidden: "Masqué",
    adminCompanyBlockNoText: "Aucun texte",
    adminCompanyEmpty: "Aucun contenu. Ajoutez votre premier bloc.",
    adminCompanyBlockModified: "Bloc modifié",
    adminCompanyBlockAdded: "Bloc ajouté",
    adminCompanyBlockDeleted: "Bloc supprimé",
    adminCompanyBlockImageTooBig: "Image trop lourde",
    adminCompanyBlockImageMaxSize: "Maximum 2 Mo",
    adminCompanyBlockDeletePrefix: "Supprimer «",
    adminCompanyBlockSave: "Enregistrer",
    adminContentDesc: "Modifiez ici tous les textes, messages et pop-up de l'application. Les modifications sont appliquées après enregistrement.",
    adminContentSaved: "Textes enregistrés !",
    adminContentSave: "Enregistrer les textes",
    adminWheelTitle: "Configuration de la roue",
    adminWheelDesc: "Les 8 prix restent visibles sur la roue. Une case désactivée reste affichée, mais ne peut jamais être tirée comme gain.",
    adminWheelSection: "Section",
    adminWheelCanWin: "Gagnable",
    adminWheelCannotWin: "Non gagnable",
    adminWheelDisplayName: "Nom affiché",
    adminWheelDisplayNamePlaceholder: "Ex. Petit gain",
    adminWheelAmount: "Montant (FCFA)",
    adminWheelColor: "Couleur",
    adminWheelWarning: "Activez au moins une section gagnable avant d'enregistrer.",
    adminWheelSave: "Enregistrer la roue",
    adminWheelSaved: "Configuration de la roue enregistrée !",
    adminWheelSaveError: "Impossible d'enregistrer la roue",
    adminWithdrawalAutoBtn: "Auto",
    adminWithdrawalManualBtn: "Manuel",
    adminWithdrawalSearchPlaceholder: "Rechercher par numéro ou nom...",
    adminWithdrawal2FA: "2FA NOWPayments",
    adminWithdrawalNowPaymentsId: "Payout NOWPayments :",
    adminWithdrawalNowPaymentsValidated: "Payout NOWPayments validé",
    adminWithdrawalNowPaymentsValidatedDesc: "Le retrait est maintenant en cours de traitement.",
    adminWithdrawalNowPaymentsFailed: "Validation NOWPayments échouée",
    adminWithdrawalServerError: "Erreur serveur",
    adminWithdrawalAt: " à ",
    adminSettingsSaved: "Paramètres enregistrés !",
    adminSettingsGoOnline: "Remettre le site en ligne",
    adminSettingsGoOffline: "Mettre le site hors service",
    adminSettingsMaintenanceMode: "Mode maintenance",
    adminSettingsMaintenanceActive: "En maintenance",
    adminSettingsRunning: "En ligne",
    approve: "Approuver",
    reject: "Rejeter",
    rejectAndBan: "Rejeter et bannir",
    amount: "Montant",
    operator: "Opérateur",
    payerNumber: "Numéro payeur",
    date: "Date",
    recipientNumber: "Numéro destinataire",
    reference: "Référence",
    paymentMessageReceived: "Message de paiement reçu",
    screenshot: "Capture d'écran",
    grossAmount: "Montant brut",
    netAmount: "Montant net",
    fees: "Frais",
    method: "Méthode",
    bep20Address: "Adresse BEP-20",
    dateTime: "Date/Heure",
    enter2FACode: "Saisir le code 2FA",
    promoter: "Promoteur",
    channel: "Canal",
    beneficiary: "Bénéficiaire",
    country: "Pays",
    adminWithdrawal2FALabel: "2FA",
    adminWithdrawal2FAFailed: "Validation NOWPayments échouée",
    adminWithdrawal2FAValidated: "Payout NOWPayments validé",
    adminWithdrawal2FAProcessing: "Le retrait est maintenant en cours de traitement.",
    adminWithdrawalPayoutId: "Payout NOWPayments :",
  },

};

// ── Context ──────────────────────────────────────────────────────────────────

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nCtx>({
  lang: "fr",
  setLang: () => {},
  t: T.fr,
});

const STORAGE_KEY = "powerade_lang_v4";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return "fr";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
