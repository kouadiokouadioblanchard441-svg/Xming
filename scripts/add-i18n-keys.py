#!/usr/bin/env python3
"""Add extended admin/team translation keys to all 6 language blocks in i18n.tsx."""

with open('client/src/lib/i18n.tsx', 'r') as f:
    content = f.read()

# ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

new_types = """  // ─── Team / Admin extended ───────────────────────────────────────────────
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
  teamLevel1: string;
  teamLevel2: string;
  teamLevel3: string;
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
  adminTaskCenterDesc: string;"""

content = content.replace(
    '  adminTabCompany: string;\n};',
    '  adminTabCompany: string;\n' + new_types + '\n};'
)

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def make_keys(vals):
    """vals: list of (key, value) tuples → formatted ts object lines"""
    lines = []
    for k, v in vals:
        escaped = v.replace('\\', '\\\\')
        lines.append(f'    {k}:{" " * max(1, 26 - len(k))}"{escaped}",')
    return '\n'.join(lines)

KEYS = [
    ("teamRegisteredOn",         {"zh":"注册于","fr":"Inscrit le","en":"Registered on","pt":"Registrado em","es":"Registrado el","ar":"مسجل في"}),
    ("teamActiveProduct",        {"zh":"活跃产品","fr":"Produit actif","en":"Active product","pt":"Produto ativo","es":"Producto activo","ar":"منتج نشط"}),
    ("teamDeposited",            {"zh":"已存款","fr":"A déposé","en":"Deposited","pt":"Depositou","es":"Ha depositado","ar":"أودع"}),
    ("teamTotalInvested",        {"zh":"总投资额","fr":"Total investi","en":"Total invested","pt":"Total investido","es":"Total invertido","ar":"إجمالي الاستثمار"}),
    ("teamPurchasedProducts",    {"zh":"已购产品:","fr":"Produits achetés:","en":"Purchased products:","pt":"Produtos comprados:","es":"Productos comprados:","ar":"المنتجات المشتراة:"}),
    ("teamActiveStatus",         {"zh":"活跃","fr":"Actif","en":"Active","pt":"Ativo","es":"Activo","ar":"نشط"}),
    ("teamEndedStatus",          {"zh":"已结束","fr":"Terminé","en":"Ended","pt":"Encerrado","es":"Terminado","ar":"منتهي"}),
    ("teamNoProductPurchased",   {"zh":"无已购产品","fr":"Aucun produit acheté","en":"No product purchased","pt":"Nenhum produto comprado","es":"Ningún producto comprado","ar":"لا يوجد منتج مشترى"}),
    ("teamLevel",                {"zh":"级别","fr":"Niveau","en":"Level","pt":"Nível","es":"Nivel","ar":"المستوى"}),
    ("teamMember",               {"zh":"成员","fr":"membre","en":"member","pt":"membro","es":"miembro","ar":"عضو"}),
    ("teamTotalTeamInvested",    {"zh":"团队总投资额","fr":"Total investi par l'équipe","en":"Total invested by team","pt":"Total investido pela equipa","es":"Total invertido por el equipo","ar":"إجمالي استثمار الفريق"}),
    ("teamLevelShort",           {"zh":"级","fr":"Niv.","en":"Lvl.","pt":"Nív.","es":"Niv.","ar":"مست."}),
    ("teamNoLevel1",             {"zh":"无一级下线","fr":"Aucun filleul niveau 1","en":"No level 1 referral","pt":"Sem referido nível 1","es":"Sin referido nivel 1","ar":"لا يوجد مُحال من المستوى 1"}),
    ("teamNoLevel2",             {"zh":"无二级下线","fr":"Aucun filleul niveau 2","en":"No level 2 referral","pt":"Sem referido nível 2","es":"Sin referido nivel 2","ar":"لا يوجد مُحال من المستوى 2"}),
    ("teamNoLevel3",             {"zh":"无三级下线","fr":"Aucun filleul niveau 3","en":"No level 3 referral","pt":"Sem referido nível 3","es":"Sin referido nivel 3","ar":"لا يوجد مُحال من المستوى 3"}),
    ("teamUserNotFound",         {"zh":"用户未找到","fr":"Utilisateur non trouvé","en":"User not found","pt":"Utilizador não encontrado","es":"Usuario no encontrado","ar":"المستخدم غير موجود"}),
    ("teamTeamOf",               {"zh":"团队","fr":"Équipe de","en":"Team of","pt":"Equipa de","es":"Equipo de","ar":"فريق"}),
    ("teamLevel1",               {"zh":"一级","fr":"Niveau 1","en":"Level 1","pt":"Nível 1","es":"Nivel 1","ar":"المستوى 1"}),
    ("teamLevel2",               {"zh":"二级","fr":"Niveau 2","en":"Level 2","pt":"Nível 2","es":"Nivel 2","ar":"المستوى 2"}),
    ("teamLevel3",               {"zh":"三级","fr":"Niveau 3","en":"Level 3","pt":"Nível 3","es":"Nivel 3","ar":"المستوى 3"}),
    ("adminCancel",              {"zh":"取消","fr":"Annuler","en":"Cancel","pt":"Cancelar","es":"Cancelar","ar":"إلغاء"}),
    ("adminSave",                {"zh":"保存","fr":"Enregistrer","en":"Save","pt":"Guardar","es":"Guardar","ar":"حفظ"}),
    ("adminCreate",              {"zh":"创建","fr":"Créer","en":"Create","pt":"Criar","es":"Crear","ar":"إنشاء"}),
    ("adminConfirmDelete",       {"zh":"确认删除","fr":"Confirmer la suppression","en":"Confirm deletion","pt":"Confirmar eliminação","es":"Confirmar eliminación","ar":"تأكيد الحذف"}),
    ("adminSearchByPhoneOrName", {"zh":"按手机号或姓名搜索...","fr":"Rechercher par numero ou nom...","en":"Search by number or name...","pt":"Pesquisar por número ou nome...","es":"Buscar por número o nombre...","ar":"بحث برقم أو اسم..."}),
    ("adminSearchDeposit",       {"zh":"按姓名、号码、参考搜索...","fr":"Rechercher par nom, numéro, référence...","en":"Search by name, number, reference...","pt":"Pesquisar por nome, número, referência...","es":"Buscar por nombre, número, referencia...","ar":"بحث بالاسم أو الرقم أو المرجع..."}),
    ("adminChannelName",         {"zh":"渠道名称","fr":"Nom du canal","en":"Channel name","pt":"Nome do canal","es":"Nombre del canal","ar":"اسم القناة"}),
    ("adminRedirectUrl",         {"zh":"跳转链接","fr":"URL de redirection","en":"Redirect URL","pt":"URL de redirecionamento","es":"URL de redirección","ar":"رابط إعادة التوجيه"}),
    ("adminApiPayment",          {"zh":"自动API支付","fr":"Paiement API automatique","en":"Automatic API payment","pt":"Pagamento API automático","es":"Pago API automático","ar":"دفع API تلقائي"}),
    ("adminNoChannel",           {"zh":"暂无支付渠道","fr":"Aucun canal de paiement","en":"No payment channel","pt":"Sem canal de pagamento","es":"Sin canal de pago","ar":"لا يوجد قناة دفع"}),
    ("adminEditChannel",         {"zh":"编辑渠道","fr":"Modifier le canal","en":"Edit channel","pt":"Editar canal","es":"Editar canal","ar":"تعديل القناة"}),
    ("adminNewChannel",          {"zh":"新建渠道","fr":"Nouveau canal","en":"New channel","pt":"Novo canal","es":"Nuevo canal","ar":"قناة جديدة"}),
    ("adminAutoMode",            {"zh":"自动","fr":"Auto","en":"Auto","pt":"Auto","es":"Auto","ar":"تلقائي"}),
    ("adminManualMode",          {"zh":"手动","fr":"Manuel","en":"Manual","pt":"Manual","es":"Manual","ar":"يدوي"}),
    ("adminManualModeActivated", {"zh":"✋ 手动模式已激活","fr":"✋ Mode Manuel activé","en":"✋ Manual mode activated","pt":"✋ Modo Manual ativado","es":"✋ Modo Manual activado","ar":"✋ تم تفعيل الوضع اليدوي"}),
    ("adminAutoModeActivated",   {"zh":"⚡ 自动模式(NOWPayments)已激活","fr":"⚡ Mode Automatique (NOWPayments) activé","en":"⚡ Automatic mode (NOWPayments) activated","pt":"⚡ Modo Automático (NOWPayments) ativado","es":"⚡ Modo Automático (NOWPayments) activado","ar":"⚡ تم تفعيل الوضع التلقائي (NOWPayments)"}),
    ("adminManualModeLabel",     {"zh":"手动模式","fr":"Mode Manuel","en":"Manual mode","pt":"Modo Manual","es":"Modo Manual","ar":"الوضع اليدوي"}),
    ("adminAutoModeLabel",       {"zh":"自动模式","fr":"Mode Automatique","en":"Automatic mode","pt":"Modo Automático","es":"Modo Automático","ar":"الوضع التلقائي"}),
    ("adminManualModeDesc",      {"zh":"您手动验证每笔提现","fr":"Vous validez chaque retrait manuellement","en":"You validate each withdrawal manually","pt":"Você valida cada levantamento manualmente","es":"Usted valida cada retiro manualmente","ar":"تتحقق من كل سحب يدوياً"}),
    ("adminAutoModeDesc",        {"zh":"NOWPayments自动处理+2FA验证码","fr":"NOWPayments traite automatiquement + code 2FA","en":"NOWPayments processes automatically + 2FA code","pt":"NOWPayments processa automaticamente + código 2FA","es":"NOWPayments procesa automáticamente + código 2FA","ar":"NOWPayments يعالج تلقائياً + رمز 2FA"}),
    ("adminNoWithdrawals",       {"zh":"未找到提现记录","fr":"Aucun retrait trouvé","en":"No withdrawal found","pt":"Nenhum levantamento encontrado","es":"No se encontraron retiros","ar":"لا توجد مسحوبات"}),
    ("adminManualPayment",       {"zh":"手动支付","fr":"Paiement manuel","en":"Manual payment","pt":"Pagamento manual","es":"Pago manual","ar":"دفع يدوي"}),
    ("adminUserActive",          {"zh":"活跃","fr":"Actif","en":"Active","pt":"Ativo","es":"Activo","ar":"نشط"}),
    ("adminUserDeposited",       {"zh":"已存款","fr":"A déposé","en":"Deposited","pt":"Depositou","es":"Ha depositado","ar":"أودع"}),
    ("adminUserTeamTitle",       {"zh":"用户团队","fr":"Equipe de l'utilisateur","en":"User team","pt":"Equipa do utilizador","es":"Equipo del usuario","ar":"فريق المستخدم"}),
    ("adminUserRegisteredOn",    {"zh":"注册时间:","fr":"Inscrit:","en":"Registered:","pt":"Registado:","es":"Registrado:","ar":"تسجيل:"}),
    ("adminUserNotProvided",     {"zh":"未填写","fr":"Non renseigné","en":"Not provided","pt":"Não fornecido","es":"No proporcionado","ar":"غير مُدرج"}),
    ("adminUserTransactionPwd",  {"zh":"交易密码","fr":"Mdp transaction","en":"Transaction pwd","pt":"Senha transação","es":"Contraseña transacción","ar":"كلمة مرور المعاملة"}),
    ("adminUserInvitedBy",       {"zh":"邀请人","fr":"Invité par","en":"Invited by","pt":"Convidado por","es":"Invitado por","ar":"مدعو من"}),
    ("adminUserReferralCode",    {"zh":"推荐码","fr":"Code parrain","en":"Referral code","pt":"Código de referido","es":"Código de referido","ar":"كود الإحالة"}),
    ("adminEditBalance",         {"zh":"修改余额(可用)","fr":"Modifier le solde (disponible)","en":"Edit balance (available)","pt":"Editar saldo (disponível)","es":"Editar saldo (disponible)","ar":"تعديل الرصيد (المتاح)"}),
    ("adminNewBalance",          {"zh":"新余额","fr":"Nouveau solde","en":"New balance","pt":"Novo saldo","es":"Nuevo saldo","ar":"الرصيد الجديد"}),
    ("adminEditEarnings",        {"zh":"修改收益余额(总计)","fr":"Modifier le solde des gains (total)","en":"Edit earnings balance (total)","pt":"Editar saldo de ganhos (total)","es":"Editar saldo de ganancias (total)","ar":"تعديل رصيد الأرباح (الإجمالي)"}),
    ("adminNewEarnings",         {"zh":"新收益余额","fr":"Nouveau solde des gains","en":"New earnings balance","pt":"Novo saldo de ganhos","es":"Nuevo saldo de ganancias","ar":"رصيد الأرباح الجديد"}),
    ("adminResetPasswordLabel",  {"zh":"重置密码","fr":"Réinitialiser mot de passe","en":"Reset password","pt":"Redefinir senha","es":"Restablecer contraseña","ar":"إعادة تعيين كلمة المرور"}),
    ("adminNewPassword",         {"zh":"新密码","fr":"Nouveau mot de passe","en":"New password","pt":"Nova senha","es":"Nueva contraseña","ar":"كلمة المرور الجديدة"}),
    ("adminAssignProduct",       {"zh":"分配产品","fr":"Attribuer un produit","en":"Assign product","pt":"Atribuir produto","es":"Asignar producto","ar":"تعيين منتج"}),
    ("adminChooseProduct",       {"zh":"选择产品","fr":"Choisir un produit","en":"Choose a product","pt":"Escolher um produto","es":"Elegir un producto","ar":"اختر منتجاً"}),
    ("adminUserProductsLabel",   {"zh":"用户产品","fr":"Produits de l'utilisateur","en":"User products","pt":"Produtos do utilizador","es":"Productos del usuario","ar":"منتجات المستخدم"}),
    ("adminNoProduct",           {"zh":"无产品","fr":"Aucun produit","en":"No product","pt":"Sem produto","es":"Sin producto","ar":"لا يوجد منتج"}),
    ("adminPinCode",             {"zh":"管理员PIN码","fr":"Code PIN pour l'admin","en":"Admin PIN code","pt":"Código PIN do admin","es":"Código PIN del admin","ar":"رمز PIN للمشرف"}),
    ("adminTaskName",            {"zh":"层级名称","fr":"Nom du palier","en":"Level name","pt":"Nome do nível","es":"Nombre del nivel","ar":"اسم المستوى"}),
    ("adminTaskNamePlaceholder", {"zh":"例：铜牌推荐人","fr":"Ex : Parrain Bronze","en":"Ex: Bronze Sponsor","pt":"Ex: Patrocinador Bronze","es":"Ej: Patrocinador Bronce","ar":"مثال: الراعي البرونزي"}),
    ("adminTaskDescriptionLabel",{"zh":"描述","fr":"Description","en":"Description","pt":"Descrição","es":"Descripción","ar":"الوصف"}),
    ("adminTaskDescriptionPlaceholder",{"zh":"例：邀请3人投资","fr":"Ex : Inviter 3 personnes à investir","en":"Ex: Invite 3 people to invest","pt":"Ex: Convidar 3 pessoas a investir","es":"Ej: Invitar a 3 personas a invertir","ar":"مثال: دعوة 3 أشخاص للاستثمار"}),
    ("adminTaskRequiredInvites", {"zh":"所需邀请数","fr":"Invitations requises","en":"Required invitations","pt":"Convites necessários","es":"Invitaciones requeridas","ar":"الدعوات المطلوبة"}),
    ("adminTaskReward",          {"zh":"奖励 (USDT)","fr":"Récompense (USDT)","en":"Reward (USDT)","pt":"Recompensa (USDT)","es":"Recompensa (USDT)","ar":"المكافأة (USDT)"}),
    ("adminTaskSortOrder",       {"zh":"显示顺序","fr":"Ordre d'affichage","en":"Display order","pt":"Ordem de exibição","es":"Orden de visualización","ar":"ترتيب العرض"}),
    ("adminTaskNew",             {"zh":"新任务","fr":"Nouvelle tâche","en":"New task","pt":"Nova tarefa","es":"Nueva tarea","ar":"مهمة جديدة"}),
    ("adminTaskEdit",            {"zh":"编辑任务","fr":"Modifier la tâche","en":"Edit task","pt":"Editar tarefa","es":"Editar tarea","ar":"تعديل المهمة"}),
    ("adminTaskActive",          {"zh":"活跃","fr":"Actif","en":"Active","pt":"Ativo","es":"Activo","ar":"نشط"}),
    ("adminTaskInactive",        {"zh":"未激活","fr":"Inactif","en":"Inactive","pt":"Inativo","es":"Inactivo","ar":"غير نشط"}),
    ("adminTaskCreated",         {"zh":"任务已创建！","fr":"Tâche créée !","en":"Task created!","pt":"Tarefa criada!","es":"¡Tarea creada!","ar":"تم إنشاء المهمة!"}),
    ("adminTaskUpdated",         {"zh":"任务已更新！","fr":"Tâche mise à jour !","en":"Task updated!","pt":"Tarefa atualizada!","es":"¡Tarea actualizada!","ar":"تم تحديث المهمة!"}),
    ("adminTaskDeleted",         {"zh":"任务已删除","fr":"Tâche supprimée","en":"Task deleted","pt":"Tarefa eliminada","es":"Tarea eliminada","ar":"تم حذف المهمة"}),
    ("adminTaskDeleteWarning",   {"zh":"此任务将被永久删除。已领取此任务的用户不受影响。","fr":"Cette tâche sera définitivement supprimée. Les utilisateurs qui l'ont déjà réclamée ne seront pas affectés.","en":"This task will be permanently deleted. Users who have already claimed it will not be affected.","pt":"Esta tarefa será eliminada permanentemente. Os utilizadores que já a reclamaram não serão afetados.","es":"Esta tarea será eliminada permanentemente. Los usuarios que ya la han reclamado no se verán afectados.","ar":"سيتم حذف هذه المهمة نهائياً. لن يتأثر المستخدمون الذين طالبوا بها بالفعل."}),
    ("adminTaskDelete",          {"zh":"删除","fr":"Supprimer","en":"Delete","pt":"Eliminar","es":"Eliminar","ar":"حذف"}),
    ("adminNoTasks",             {"zh":"暂无任务","fr":"Aucune tâche","en":"No tasks","pt":"Sem tarefas","es":"Sin tareas","ar":"لا توجد مهام"}),
    ("adminTaskCenterTitle",     {"zh":"任务中心","fr":"Centre des tâches","en":"Task center","pt":"Centro de tarefas","es":"Centro de tareas","ar":"مركز المهام"}),
    ("adminTaskCenterDesc",      {"zh":"管理推荐等级及奖励","fr":"Gérez les paliers de parrainage et leurs récompenses","en":"Manage referral tiers and their rewards","pt":"Gerir os níveis de referência e as suas recompensas","es":"Gestione los niveles de referencia y sus recompensas","ar":"إدارة مستويات الإحالة ومكافآتها"}),
]

LANGS = [
    ("zh", '    adminTabCompany:        "公司",\n  },\n  fr: {'),
    ("fr", '    adminTabCompany:        "Compagnie",\n  },\n  en: {'),
    ("en", '    adminTabCompany:        "Company",\n  },\n  pt: {'),
    ("pt", '    adminTabCompany:        "Empresa",\n  },\n  es: {'),
    ("es", '    adminTabCompany:        "Empresa",\n  },\n  ar: {'),
    ("ar", '    adminTabCompany:        "\u0627\u0644\u0634\u0631\u0643\u0629",\n  },\n};'),
]

LANG_CLOSE = {
    "zh": '  },\n  fr: {',
    "fr": '  },\n  en: {',
    "en": '  },\n  pt: {',
    "pt": '  },\n  es: {',
    "es": '  },\n  ar: {',
    "ar": '  },\n};',
}

LANG_COMPANY = {
    "zh": '"公司"',
    "fr": '"Compagnie"',
    "en": '"Company"',
    "pt": '"Empresa"',
    "es": '"Empresa"',
    "ar": '"\u0627\u0644\u0634\u0631\u0643\u0629"',
}

for lang, anchor in LANGS:
    close = LANG_CLOSE[lang]
    company = LANG_COMPANY[lang]
    new_lines = make_keys([(k, v[lang]) for k, v in KEYS])
    old = f'    adminTabCompany:        {company},\n{close}'
    new = f'    adminTabCompany:        {company},\n{new_lines}\n{close}'
    if old not in content:
        print(f"WARNING: anchor not found for lang={lang}")
    content = content.replace(old, new, 1)

with open('client/src/lib/i18n.tsx', 'w') as f:
    f.write(content)

# Verify
count = content.count('adminTaskCenterDesc')
print(f"OK — adminTaskCenterDesc appears {count} times (expected 7: 1 type + 6 langs)")
