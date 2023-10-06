app.post(urlAdminDefault,settingScreenController.createSettingScreenAction)
app.get(urlDefault + '/products', settingScreenController.findSettingItemForProductListScreenAction)


const findSettingItemForProductListScreenAction = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction)=>{
    try{
        const screen = get(req, 'query.screen');
        const website = get(req, 'query.website');
        const group_id = +get(req, 'query.group_id');
        if(group_id > 0){
            const where: any = {}
            where.screen = screen
            where.website = website
            where.group_id = group_id
            const data = await settingScreen.findSettingItemForProductListScreen(where);
            const response = JSON.parse(JSON.stringify(data))
            let items = response.items
            items = items.sort(function (a: any, b: any) {  return a.position - b.position;  });
            response.items = items
            res.send(setResponse(response));
        }else{
            res.send(setResponse(null));
        }
    }catch (e) {
        logger.error('findSettingItemForProductListScreenAction', e);
        next(e);
    }
}

const createSettingScreenAction = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction) =>{
  try{
      const { screen, website, group_id} = req.body;
      const setScreen = await settingScreen.createSettingScreen(screen,website,group_id);
      res.send(setResponse({setScreen: setScreen}));
  }catch (e) {
      logger.error('createSettingScreenAction', e);
      next(e);
  }
}


const findSettingProductListScreen = async (where: any) =>{
    let data = JSON.parse(JSON.stringify(await SettingScreen.findOne({
        where
    })))
    if(data != null){
        let items = JSON.parse(JSON.stringify(await SettingScreenItem.findAll({
            where:{
                screen_id: data.id
            }
        })))
        if(items != null){
            for (let itemKey in items){
                let screen_item_id = items[itemKey].id
                items[itemKey].item_details = JSON.parse(JSON.stringify(await SettingScreenItemDetail.findAll({
                    where:{
                        screen_item_id: screen_item_id
                    }
                })))
                if(items[itemKey].item_details[0] != null){
                    let category_id = items[itemKey].item_details[0].category_id
                    items[itemKey].item_details[0].category =
                        await Category.findOne({
                            where: {
                                id: category_id
                            }
                        });
                    items[itemKey].item_products = []
                    if(category_id != null){
                        items[itemKey].item_products = JSON.parse(JSON.stringify(await Product.findAll({
                            where:{
                                category_id: category_id
                            }
                        })))
                    }
                    if(items[itemKey].item_products != null){
                        for(let itemProductKey in items[itemKey].item_products){
                            let itemProduct:any = {}
                            itemProduct.product_id =
                                items[itemKey].item_products[itemProductKey].id;
                            itemProduct.product =
                                items[itemKey].item_products[itemProductKey];
                            items[itemKey].item_products[itemProductKey] = itemProduct;
                        }
                    }
                }
            }
        }
        data.items = items
    }
    return data;
}

const createSettingScreen = async (screen: string, website: string, groupId?: any) => {
  let settingScreen
  if (groupId && groupId > 0) {
      settingScreen = await SettingScreen.create({screen: screen, website: website, is_public: 0, group_id: groupId})
  } else {
      settingScreen = await SettingScreen.create({screen: screen, website: website, is_public: 0})
  }
  const screenItems = []
  let status = true
  for (let i = 1; i <= PAGE_ENUM.max; i++) {
      const screen_detail = PAGE_ENUM.screen_item + i
      let setting_screen = PAGE_ENUM.screen_item + i
      if (screen === PAGE_ENUM.home_screen) {
          if (screen_detail !== null && PAGE_ENUM.homes[i-1]) {
              setting_screen = PAGE_ENUM.homes[i-1].name
          }
      } else if (screen === PAGE_ENUM.promotion_screen && PAGE_ENUM.promotions[i-1]) {
          if (screen_detail !== null) {
              setting_screen = PAGE_ENUM.promotions[i-1].name
          }
      } else if (screen === PAGE_ENUM.banner_screen && PAGE_ENUM.banners[i-1]) {
          if (screen_detail !== null) {
              setting_screen = PAGE_ENUM.banners[i-1].name
          }
      } else if (screen === PAGE_ENUM.recruitment_screen && PAGE_ENUM.recruitments[i-1]) {
          if (screen_detail !== null) {
              setting_screen = PAGE_ENUM.recruitments[i-1].name
          }
      }else if(screen === PAGE_ENUM.product_list_screen && PAGE_ENUM.productlists[i-1]){
          if(screen_detail !== null){
              setting_screen = PAGE_ENUM.productlists[i-1].name
          }
      }
      screenItems.push({position: i, screen: screen_detail, setting_screen: setting_screen, status: status, screen_id: get(settingScreen, 'id')})
  }
  await SettingScreenItem.bulkCreate(screenItems)
  return await findSettingScreen({ screen: screen, website: website, is_public: 0 })
}

product_list_screen: 'product_list_screen',

product_lists: [
  {name: 'product_categories'},
  {name: 'product_category_1'},
  {name: 'product_category_2'},
  {name: 'product_category_3'}
],