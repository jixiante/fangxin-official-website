// Categories and composition follow the seven supplied HTML references.
export const detailGroups={
 beauty:[
  {id:'masks',label:['调敷药膜','Herbal masks','Травяные маски'],items:['herbal-mask','facial-care','moisturising-mask']},
  {id:'tools',label:['器具护理','Tool-based care','Уход с инструментами'],items:['li-stone-beauty','chinese-spa']},
  {id:'manual',label:['手法护理','Manual care','Ручные техники'],items:['gua-sha']}],
 nursing:[
  {id:'moxa',label:['灸类','Moxibustion','Моксотерапия'],items:['suspended-moxa','thunder-moxa']},
  {id:'cups',label:['罐类','Cupping','Баночные техники'],items:['cupping']},
  {id:'patches',label:['贴敷类','Patches','Аппликации'],items:['ear-care','herbal-patch']},
  {id:'manual',label:['手法类','Manual techniques','Ручные техники'],items:['scraping-care']}],
 diet:[
  {id:'soups',label:['汤羹类','Soups','Супы'],items:['goji-ribs','three-bean-soup','lotus-duck','four-ingredient-ribs']},
  {id:'desserts',label:['甜品类','Desserts','Десерты'],items:['pear-soup','papaya-milk','red-bean']},
  {id:'teas',label:['茶饮类','Teas & drinks','Чаи и напитки'],items:['shanlan-tea','niudali-tea','agarwood-tea','sour-plum']},
  {id:'botanical',label:['植物饮料','Botanical drinks','Растительные напитки'],items:['yizhi-drink']}]
};
export const detailLabels={
 zh:{all:'全部',filter:'按类型筛选',zoom:'放大查看',hasFilm:'有影像',view:'查看',reading:'阅读说明',cta:'共探海南康养生活的更多可能',academies:'岐黄学堂',courses:'技能与兴趣课程'},
 en:{all:'All',filter:'Filter by category',zoom:'Enlarge image',hasFilm:'With film',view:'Explore: ',reading:'Before you explore',cta:'Discover more possibilities for wellbeing in Hainan',academies:'Qihuang academies',courses:'Skills & creative courses'},
 ru:{all:'Все',filter:'Фильтр по категории',zoom:'Увеличить изображение',hasFilm:'Есть видео',view:'Подробнее: ',reading:'Перед просмотром',cta:'Откройте новые возможности оздоровительного отдыха на Хайнане',academies:'Школы Цихуан',courses:'Практические и творческие курсы'}
};
export const detailHero={wellness:'wellness-focus',beauty:'catalog/beauty-004',nursing:'content-consultation',diet:'content-pear-soup',incense:'incense',limiao:'catalog/care-053',training:'detail/training-hero',selection:'detail/selection-hero'};
// Ingredient highlights from the supplied beauty reference; full source caveats remain in the facts.
export const detailIngredients={
 'herbal-mask':{zh:['白术','白芍','白茯苓','白芨','白蔹','白芷','珍珠粉'],en:['Atractylodes','White peony','Poria','Bletilla','Ampelopsis','Angelica dahurica','Pearl powder'],ru:['Атрактилодес','Белый пион','Пория','Блетилла','Ампелопсис','Дудник даурский','Жемчужный порошок']},
 'facial-care':{zh:['人参','当归','等草本'],en:['Ginseng','Dang gui','Other botanicals'],ru:['Женьшень','Дягиль китайский','Другие растения']},
 'moisturising-mask':{zh:['珍珠粉','西洋参'],en:['Pearl powder','American ginseng'],ru:['Жемчужный порошок','Американский женьшень']}
};
