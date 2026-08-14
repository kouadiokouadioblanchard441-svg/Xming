// Registry of admin-editable text content shown across the client app.
// Each field is stored as a key in the generic `platformSettings` key/value
// table (reusing the existing /api/settings + /api/admin/settings endpoints),
// so adding a new field here is all that's needed to make it editable from
// Admin > Contenu — no backend changes required.
//
// `key` is the settings key used everywhere (client pages read it with a
// fallback to `defaultValue`, matching the text that used to be hardcoded).

export interface ContentField {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
}

export interface ContentGroup {
  id: string;
  title: string;
  fields: ContentField[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "home",
    title: "首页 — 通知弹窗",
    fields: [
      { key: "content_home_popupTitle", label: "弹窗标题", defaultValue: "通知" },
      { key: "content_home_popupLine1", label: "第1行", defaultValue: "Power Add 成立于1996年，是 Tekman 集团旗下的独立部门。", multiline: true },
      { key: "content_home_popupLine2", label: "第2行", defaultValue: "Power Add 专注于电源、转换器和定制设计。", multiline: true },
      { key: "content_home_popupLine3", label: "第3行", defaultValue: "Power Add 提供适配器、开放式电源、U 型电源、盒式电源和 DC/DC 转换器等解决方案。", multiline: true },
      { key: "content_home_popupLine4", label: "第4行", defaultValue: "研发和试生产位于台湾，大规模生产位于台湾和中国。", multiline: true },
      { key: "content_home_popupLine5", label: "第5行", defaultValue: "Power Add 已通过 ISO 9001 和 ISO 14001 认证，并持续提升产品质量。", multiline: true },
    ],
  },
  {
    id: "rules",
    title: "平台规则弹窗",
    fields: [
      { key: "content_rules_title", label: "弹窗标题", defaultValue: "平台规则" },
      { key: "content_rules_section1Title", label: "第1部分标题", defaultValue: "1. 充值" },
      { key: "content_rules_section1Body", label: "第1部分内容", defaultValue: "- 最低金额：4 USDT\n- 充值将尽快处理\n- 请确认支付信息正确", multiline: true },
      { key: "content_rules_section2Title", label: "第2部分标题", defaultValue: "2. 提现" },
      { key: "content_rules_section2Body", label: "第2部分内容", defaultValue: "- 最低金额：1.5 USDT\n- 提现手续费：18%\n- 时间：9:00 - 17:00\n- 每天最多提现1次\n- 需要有效产品\n- 需要先登记提现钱包", multiline: true },
      { key: "content_rules_section3Title", label: "第3部分标题", defaultValue: "3. 产品" },
      { key: "content_rules_section3Body", label: "第3部分内容", defaultValue: "- 标准周期：80天\n- 每日自动产生收益\n- 收益每24小时到账\n- 免费产品可领取每日奖励", multiline: true },
      { key: "content_rules_section4Title", label: "第4部分标题", defaultValue: "4. 推荐奖励" },
      { key: "content_rules_section4Body", label: "第4部分内容", defaultValue: "- 一级：15%佣金\n- 二级：2%佣金\n- 三级：1%佣金\n- 产品购买可获得佣金", multiline: true },
      { key: "content_rules_section5Title", label: "第5部分标题", defaultValue: "5. 注册奖励" },
      { key: "content_rules_section5Body", label: "第5部分内容", defaultValue: "每位新会员注册后可获得500 USDT奖励。", multiline: true },
    ],
  },
  {
    id: "team",
    title: "团队 / 推荐",
    fields: [
      { key: "content_team_headerTitle", label: "页面标题", defaultValue: "我的团队" },
      { key: "content_team_taskCenterButton", label: "任务中心按钮", defaultValue: "前往任务中心 >" },
      { key: "content_team_inviteTitle", label: "邀请好友标题", defaultValue: "邀请好友" },
      { key: "content_team_progressTitle", label: "我的进度标题", defaultValue: "我的进度" },
      { key: "content_team_howItWorksTitle", label: "推荐机制标题", defaultValue: "推荐机制" },
      { key: "content_team_tip", label: "页面底部提示", defaultValue: "三个等级的团队越大，成员每次投资时您获得的推荐收益越高。", multiline: true },
    ],
  },
  {
    id: "tasks",
    title: "任务中心（/tasks）",
    fields: [
      { key: "content_tasks_headerTitle", label: "标题", defaultValue: "推荐计划" },
      { key: "content_tasks_headerSubtitle", label: "副标题", defaultValue: "邀请好友并获得奖励" },
      { key: "content_tasks_tiersTitle", label: "推荐等级标题", defaultValue: "推荐等级" },
      { key: "content_tasks_claimAllButton", label: "全部领取按钮", defaultValue: "全部领取" },
    ],
  },
  {
    id: "salarybonus",
    title: "Centre des tâches (page /salary-bonus)",
    fields: [
      { key: "content_salarybonus_headerTitle", label: "Titre de la page", defaultValue: "Centre des tâches" },
    ],
  },
  {
    id: "checkin",
    title: "Pointage quotidien",
    fields: [
      { key: "content_checkin_headerTitle", label: "Titre de la page", defaultValue: "Pointage" },
      { key: "content_checkin_cardTitle", label: "Titre de la carte", defaultValue: "Pointage quotidien" },
      { key: "content_checkin_cardSubtitle", label: "Sous-titre de la carte", defaultValue: "Activer les récompenses quotidiennes" },
      { key: "content_checkin_dailyRewardLabel", label: "Libellé « Récompense du jour »", defaultValue: "Récompense du jour" },
      { key: "content_checkin_streakLabel", label: "Libellé « Jours consécutifs »", defaultValue: "Jours consécutifs" },
      { key: "content_checkin_totalLabel", label: "Libellé « Récompenses cumulées »", defaultValue: "Récompenses cumulées" },
      { key: "content_checkin_rule1", label: "Règle 1", defaultValue: "1. Récompense de connexion quotidienne : 0.05 USDT", multiline: true },
      { key: "content_checkin_rule2", label: "Règle 2", defaultValue: "2. Connectez-vous une fois par jour pour accumuler des points.", multiline: true },
    ],
  },
  {
    id: "giftcode",
    title: "Code Bonus",
    fields: [
      { key: "content_giftcode_headerTitle", label: "Titre de la page", defaultValue: "Code Bonus" },
      { key: "content_giftcode_infoLine1", label: "Texte d'information 1", defaultValue: "Entrez votre code bonus pour recevoir votre récompense instantanément", multiline: true },
      { key: "content_giftcode_infoLine2", label: "Texte d'information 2", defaultValue: "Les codes sont disponibles chaque soir à 17h GMT", multiline: true },
      { key: "content_giftcode_howToTitle", label: "Titre « Comment obtenir des codes ? »", defaultValue: "Comment obtenir des codes ?", multiline: true },
      { key: "content_giftcode_step1", label: "Étape 1", defaultValue: "Rejoignez notre canal Telegram officiel", multiline: true },
      { key: "content_giftcode_step2", label: "Étape 2", defaultValue: "Suivez les annonces chaque soir à 17h GMT", multiline: true },
      { key: "content_giftcode_step3", label: "Étape 3", defaultValue: "Copiez le code et collez-le ici avant expiration", multiline: true },
    ],
  },
  {
    id: "orders",
    title: "Mes commandes",
    fields: [
      { key: "content_orders_headerTitle", label: "Titre de la page", defaultValue: "Mes commandes" },
      { key: "content_orders_infoLine1", label: "Texte d'information 1", defaultValue: "Les revenus du produit sont credites automatiquement une fois toutes les 24 heures.", multiline: true },
      { key: "content_orders_infoLine2", label: "Texte d'information 2", defaultValue: "Vous pouvez acheter plusieurs machines pour augmenter vos revenus.", multiline: true },
    ],
  },
  {
    id: "products",
    title: "Nos Produits",
    fields: [
      { key: "content_products_headerTitle", label: "Titre de la page", defaultValue: "Nos Produits" },
    ],
  },
  {
    id: "deposit",
    title: "Page Dépôt / Recharge",
    fields: [
      { key: "content_deposit_infoText", label: "Texte d'information principal", defaultValue: "Les services de dépôt sont disponibles 24h/24 et 7j/7. Le dépôt minimum est indiqué ci-dessus, sans limite maximale.", multiline: true },
      { key: "content_deposit_warning1", label: "Avertissement 1 (captures d'écran)", defaultValue: "Remarque importante : Ne divulguez à personne les captures d'écran de vos dépôts ni vos identifiants de transaction, car cela pourrait entraîner le vol de vos fonds.", multiline: true },
      { key: "content_deposit_warning2", label: "Avertissement 2 (problèmes dépôt)", defaultValue: "Pour tout problème lié à vos dépôts, veuillez contacter immédiatement le service client de la plateforme.", multiline: true },
      { key: "content_deposit_instruction1", label: "Instruction 1", defaultValue: "1. Le dépôt minimum est défini dans les paramètres de la plateforme.", multiline: true },
      { key: "content_deposit_instruction2", label: "Instruction 2", defaultValue: "2. Veuillez vérifier attentivement les informations de votre compte avant d'effectuer un transfert afin d'éviter toute erreur de paiement.", multiline: true },
    ],
  },
  {
    id: "withdrawal",
    title: "Page Retrait",
    fields: [
      { key: "content_withdrawal_ctaButton", label: "Texte du bouton de retrait", defaultValue: "Retirez votre argent maintenant" },
      { key: "content_withdrawal_instructionsTitle", label: "Titre section instructions", defaultValue: "Instructions de retrait" },
      { key: "content_withdrawal_instruction1", label: "Instruction 1", defaultValue: "1. Le montant minimum de retrait est défini dans les paramètres de la plateforme.", multiline: true },
      { key: "content_withdrawal_instruction2", label: "Instruction 2", defaultValue: "2. Il n'y a pas de limite de temps pour les retraits, mais une limite de trois retraits par jour est autorisée.", multiline: true },
      { key: "content_withdrawal_instruction3", label: "Instruction 3", defaultValue: "3. Des frais de traitement seront appliqués sur chaque retrait (voir paramètres).", multiline: true },
      { key: "content_withdrawal_instruction4", label: "Instruction 4", defaultValue: "4. Les retraits seront disponibles sous 2 heures, et exceptionnellement sous 24 heures.", multiline: true },
      { key: "content_withdrawal_instruction5", label: "Instruction 5", defaultValue: "5. Si le retrait échoue, vérifiez que votre adresse USDT BEP20 est correcte, puis soumettez à nouveau la demande.", multiline: true },
      { key: "content_withdrawal_instruction6", label: "Instruction 6", defaultValue: "6. Consultez les conditions de retrait affichées par la plateforme avant votre demande.", multiline: true },
      { key: "content_withdrawal_warningNoHours", label: "Avertissement hors horaires", defaultValue: "⏰ Retraits fermés actuellement. Réessayez pendant les horaires indiqués.", multiline: true },
      { key: "content_withdrawal_warningNoProduct", label: "Avertissement sans produit actif", defaultValue: "⚠️ Vous devez avoir un produit actif pour effectuer un retrait.", multiline: true },
    ],
  },
  {
    id: "about",
    title: "Page À propos",
    fields: [
      { key: "content_about_pageTitle", label: "Titre de la page", defaultValue: "A propos de nous" },
      { key: "content_about_s1Title", label: "Titre section 1", defaultValue: "Qui sommes-nous ?" },
      { key: "content_about_s1Text1", label: "Paragraphe 1", defaultValue: "Power Add Inc. a été fondée en 1996 comme unité indépendante du groupe Tekman. L’entreprise est spécialisée dans les solutions d’alimentation électrique et dispose de capacités de recherche et développement à New Taipei City, à Taïwan.", multiline: true },
      { key: "content_about_s1Text2", label: "Paragraphe 2", defaultValue: "Power Add réalise la recherche et la fabrication pilote à Taïwan, tandis que la production de masse est réalisée à Taïwan et en Chine.", multiline: true },
      { key: "content_about_s2Title", label: "Titre section 2", defaultValue: "Produits et solutions" },
      { key: "content_about_s2Text", label: "Contenu section 2", defaultValue: "La gamme comprend des adaptateurs, des alimentations open frame, des alimentations en U, des alimentations box, des convertisseurs DC/DC et des conceptions sur mesure de 1 W à 500 W.", multiline: true },
      { key: "content_about_s3Title", label: "Titre section 3", defaultValue: "Capacités de fabrication" },
      { key: "content_about_s3Text", label: "Contenu section 3", defaultValue: "Power Add présente deux sites de fabrication : un site à Taïwan pour la recherche et la production pilote, et un site à Guangdong, en Chine, pour la production de masse.", multiline: true },
      { key: "content_about_s4Title", label: "Titre section 4", defaultValue: "Qualité et engagement" },
      { key: "content_about_s4Text", label: "Contenu section 4", defaultValue: "Power Add indique être certifiée ISO 9001 depuis 1997 et ISO 14001 depuis 2006. L’entreprise met en avant l’amélioration continue, la qualité, la performance et le travail d’équipe.", multiline: true },
    ],
  },
  {
    id: "company",
    title: "公司页面",
    fields: [
      { key: "content_company_pageTitle", label: "页面标题", defaultValue: "公司" },
      { key: "content_company_intro", label: "介绍", defaultValue: "了解我们的公司、投资计划以及平台的重要信息。", multiline: true },
    ],
  },
  {
    id: "service",
    title: "Page Service client",
    fields: [
      { key: "content_service_pageTitle", label: "Titre de la page", defaultValue: "Service client" },
      { key: "content_service_withdrawalHoursText", label: "Texte horaires de retrait", defaultValue: "Heures de retrait : 24h." },
      { key: "content_service_supportHoursLabel", label: "Libellé horaires service client", defaultValue: "Horaires du service client :" },
    ],
  },
  {
    id: "rulespage",
    title: "Page Règles de la plateforme",
    fields: [
      { key: "content_rulespage_pageTitle", label: "Titre de la page", defaultValue: "Règles de la plateforme" },
      { key: "content_rulespage_s1Title", label: "Titre section 1", defaultValue: "1. Investissement" },
      { key: "content_rulespage_s1b1", label: "Section 1 — Règle 1", defaultValue: "Chaque utilisateur peut posséder plusieurs produits d'investissement simultanément.", multiline: true },
      { key: "content_rulespage_s1b2", label: "Section 1 — Règle 2", defaultValue: "Les revenus sont générés quotidiennement et accrédités sur votre solde de compte toutes les 24 heures.", multiline: true },
      { key: "content_rulespage_s1b3", label: "Section 1 — Règle 3", defaultValue: "Le cycle d'investissement standard est de 80 jours, sauf indication contraire pour les produits spéciaux.", multiline: true },
      { key: "content_rulespage_s2Title", label: "Titre section 2", defaultValue: "2. Dépôts et Retraits" },
      { key: "content_rulespage_s3Title", label: "Titre section 3", defaultValue: "3. Système de Parrainage" },
      { key: "content_rulespage_s3b4", label: "Section 3 — Règle anti-fraude", defaultValue: "Les activités frauduleuses ou la création de comptes multiples pour manipuler le système entraîneront la suspension du compte.", multiline: true },
      { key: "content_rulespage_s4Title", label: "Titre section 4", defaultValue: "4. Bonus d'inscription" },
      { key: "content_rulespage_s5Title", label: "Titre section 5", defaultValue: "5. Sécurité" },
      { key: "content_rulespage_s5b1", label: "Section 5 — Règle 1", defaultValue: "Vous êtes responsable de la sécurité de votre mot de passe.", multiline: true },
      { key: "content_rulespage_s5b2", label: "Section 5 — Règle 2", defaultValue: "Ne partagez jamais vos identifiants de connexion avec des tiers.", multiline: true },
      { key: "content_rulespage_s5b3", label: "Section 5 — Règle 3", defaultValue: "Le service client officiel ne vous demandera jamais votre mot de passe.", multiline: true },
    ],
  },
];

export const ALL_CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap(g => g.fields);
