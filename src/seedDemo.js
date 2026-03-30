/**
 * 演示数据生成脚本
 * 在浏览器控制台中执行，或在项目中临时调用
 * 用法：import { seedDemo } from './seedDemo'; seedDemo();
 */
import { supabase } from './supabaseClient';

const DEMO_STOCKS = [
  {
    name: '宁德时代', code: '300750', status: 'holding',
    shares: '200', cost_price: '185.50', current_price: '218.30',
    thesis: '全球动力电池龙头，技术壁垒高。钠离子电池和储能业务打开第二增长曲线，海外产能扩张顺利。',
    bull_case: '1. 全球电动车渗透率仍在上升期\n2. 储能业务高增长\n3. 技术迭代快，麒麟电池领先竞争对手一代',
    bear_case: '1. 产能过剩导致价格战\n2. 磷酸铁锂技术路线可能被固态电池颠覆\n3. 海外地缘政治风险',
    anchors: [
      { name: '季度出货量(GWh)', expected: '> 100GWh', frequency: '季度', latest_value: '108.2GWh', latest_date: '2026-01-15', note: 'Q4数据超预期' },
      { name: '海外收入占比', expected: '> 35%', frequency: '半年度', latest_value: '33.8%', latest_date: '2025-12-20', note: '接近目标，欧洲工厂产能爬坡中' },
    ],
    entries: [
      { type: 'thought', content: '看了下宁德时代Q4的出货量数据，108.2GWh超预期了。储能业务占比也在提升，说明第二曲线逐渐兑现。但需要关注明年行业产能过剩的影响。', days_ago: 2 },
      { type: 'buy', content: '在185.5加仓了100股。逻辑是Q4业绩超预期+储能新签订单增长，估值回到合理区间。', price: '185.50', days_ago: 30 },
      { type: 'thought', content: '参加了一个电池行业线上交流会，业内人士普遍认为2026年是固态电池量产元年，但真正替代还需3-5年。宁德的技术储备足够应对。', days_ago: 15 },
      { type: 'adjust', content: '上调对储能业务的预期。之前预期储能收入占比2026年达到20%，现在看可能到25%。原因是国内大储招标量远超市场预期。', days_ago: 7 },
    ],
  },
  {
    name: '贵州茅台', code: '600519', status: 'holding',
    shares: '10', cost_price: '1680.00', current_price: '1520.00',
    thesis: '消费品中最强的品牌壁垒和定价权。虽然短期消费降级影响出厂价预期，但长期看茅台酒的社交属性和稀缺性不变。',
    bull_case: '1. 品牌护城河极深\n2. 毛利率90%+，现金流充沛\n3. 直营占比提升改善利润结构',
    bear_case: '1. 消费降级趋势影响高端白酒需求\n2. 批价持续下行可能影响市场情绪\n3. 年轻人饮酒习惯变化的长期风险',
    anchors: [
      { name: '批价（散飞）', expected: '> 2200元', frequency: '月度', latest_value: '2150元', latest_date: '2026-03-15', note: '节后回落，但降幅收窄' },
      { name: '直营收入占比', expected: '> 45%', frequency: '半年度', latest_value: '42.3%', latest_date: '2025-12-31', note: 'i茅台持续发力' },
    ],
    entries: [
      { type: 'thought', content: '茅台批价最近稳定在2150左右，没有继续下探，春节动销数据还可以。但大的消费周期拐点还没看到，继续持有观察。', days_ago: 5 },
      { type: 'buy', content: '1680买入10股。虽然短期有压力，但PE已经回到25倍以下，对茅台来说是合理买点。', price: '1680.00', days_ago: 60 },
      { type: 'discipline', content: '提醒自己不要因为短期批价波动而恐慌。买茅台买的是长期品牌价值，不是短期价差。', days_ago: 20 },
    ],
  },
  {
    name: '比亚迪', code: '002594', status: 'holding',
    shares: '300', cost_price: '265.00', current_price: '312.80',
    thesis: '新能源车+电池+半导体垂直整合龙头。出口量快速增长，品牌向上突破成功（仰望、腾势）。',
    bull_case: '1. 月销量持续创新高\n2. 海外市场打开（东南亚、欧洲、南美）\n3. 智能驾驶天神之眼快速迭代',
    bear_case: '1. 价格战侵蚀利润率\n2. 欧洲关税政策不确定性\n3. 高端品牌尚未完全站稳',
    anchors: [
      { name: '月销量（万辆）', expected: '> 40万辆', frequency: '月度', latest_value: '43.2万辆', latest_date: '2026-03-05', note: '3月数据创历史新高' },
      { name: '单车毛利率', expected: '> 20%', frequency: '季度', latest_value: '21.3%', latest_date: '2026-01-20', note: 'Q4略有提升，高端车型占比增加' },
      { name: '海外月销量', expected: '> 5万辆', frequency: '月度', latest_value: '5.8万辆', latest_date: '2026-03-05', note: '泰国工厂满产' },
    ],
    entries: [
      { type: 'buy', content: '265元建仓300股。逻辑是月销量趋势向好+海外放量+智驾补齐短板。目标看到350。', price: '265.00', days_ago: 45 },
      { type: 'thought', content: '比亚迪3月销量43.2万辆，又创新高了。海外5.8万辆也超预期。泰国工厂产能利用率接近100%，匈牙利工厂也在推进。', days_ago: 3 },
      { type: 'thought', content: '天神之眼2.0的城区NOA体验了一下，比去年进步很大，基本能处理80%的城区场景。和华为的差距在缩小。', days_ago: 10 },
      { type: 'adjust', content: '上调目标价到380。原因是海外增速超预期，如果下半年欧洲关税落地后影响可控，则可能进一步上调。', days_ago: 1 },
    ],
  },
  {
    name: '中际旭创', code: '300308', status: 'holding',
    shares: '500', cost_price: '88.50', current_price: '135.20',
    thesis: 'AI算力爆发的核心受益标的，800G/1.6T光模块全球领先。北美四大云厂商核心供应商，订单可见性强。',
    bull_case: '1. AI资本开支持续高增长\n2. 1.6T光模块率先量产，领先同行半年以上\n3. 客户结构优质，议价能力强',
    bear_case: '1. AI投资周期可能放缓\n2. 硅光方案可能冲击传统光模块\n3. 估值已经不便宜',
    anchors: [
      { name: '季度营收增速', expected: '> 50% YoY', frequency: '季度', latest_value: '+68% YoY', latest_date: '2026-01-25', note: 'Q4超预期，1.6T开始放量' },
      { name: '1.6T出货占比', expected: '> 20%', frequency: '季度', latest_value: '15%', latest_date: '2026-01-25', note: '快速提升中，Q1预计到25%' },
    ],
    entries: [
      { type: 'buy', content: '88.5元买入500股，赌AI光模块的确定性。旭创是800G绝对龙头，1.6T先发优势明显。', price: '88.50', days_ago: 90 },
      { type: 'thought', content: '英伟达GTC大会释放了GB300的信息，对光互联需求进一步提升。旭创作为核心供应商直接受益。', days_ago: 8 },
      { type: 'sell', content: '在120元减仓了100股，落袋一部分利润。剩余500股继续持有。', price: '120.00', days_ago: 25 },
      { type: 'thought', content: '和行业内朋友聊了下，1.6T的良率比预期好，旭创可能Q2就能把出货占比拉到30%以上。这是超预期的点。', days_ago: 4 },
      { type: 'discipline', content: '提醒自己：旭创已经翻倍了，要控制仓位。即使再看好，也不能单只股票超过总仓位的25%。', days_ago: 12 },
    ],
  },
  {
    name: '腾讯控股', code: '00700.HK', status: 'watching',
    shares: '', cost_price: '', current_price: '420.00',
    thesis: '互联网平台型公司，游戏+社交+云+金融科技多引擎驱动。视频号商业化处于早期，有较大增长空间。',
    bull_case: '1. 视频号广告收入快速增长\n2. 小游戏生态爆发\n3. 持续回购提升股东回报',
    bear_case: '1. 游戏版号政策仍有不确定性\n2. 宏观消费疲软影响广告预算\n3. 海外游戏竞争加剧',
    anchors: [
      { name: '视频号DAU', expected: '> 5亿', frequency: '季度', latest_value: '约4.5亿', latest_date: '2026-02-01', note: '管理层电话会提到' },
    ],
    entries: [
      { type: 'thought', content: '腾讯最近回购力度很大，每天都在买。视频号的商业化故事如果兑现，当前估值有吸引力。放入观察列表，等港股调整到400以下考虑建仓。', days_ago: 14 },
      { type: 'thought', content: '看了下腾讯Q4财报，游戏业务恢复增长，视频号广告收入环比+15%。整体不错，但还想等一个更好的价格。', days_ago: 6 },
    ],
  },
  {
    name: '药明康德', code: '603259', status: 'closed',
    shares: '0', cost_price: '48.00', current_price: '42.50',
    thesis: '全球CRO/CDMO龙头，受益于创新药研发外包趋势。但生物安全法案的影响需要持续观察。',
    bull_case: '1. 全球创新药研发支出长期增长\n2. 一体化平台优势\n3. 估值已反映大部分悲观预期',
    bear_case: '1. 美国生物安全法案可能实质性落地\n2. 行业去库存周期延长\n3. 大客户集中度风险',
    anchors: [
      { name: '美国客户收入占比', expected: '关注是否下降', frequency: '半年度', latest_value: '62%', latest_date: '2025-12-31', note: '略有下降但仍然很高' },
    ],
    entries: [
      { type: 'buy', content: '48元买入，博弈生物安全法案不会落地。', price: '48.00', days_ago: 120 },
      { type: 'thought', content: '法案推进速度比预期快，参议院已经通过委员会审议。需要重新评估风险。', days_ago: 80 },
      { type: 'sell', content: '42.5元止损卖出。虽然亏了，但政策风险不可控，不应该赌博。认赔出局，这个决策是对的。', price: '42.50', days_ago: 50 },
      { type: 'adjust', content: '复盘：这笔交易的问题在于低估了政策风险。以后对政策驱动型的投资要更谨慎，仓位要更小。', days_ago: 48 },
    ],
  },
];

export async function seedDemo() {
  console.log('开始生成演示数据...');

  for (const stock of DEMO_STOCKS) {
    // Insert stock
    const { data: newStock, error: stockErr } = await supabase
      .from('stocks')
      .insert({
        name: stock.name,
        code: stock.code,
        status: stock.status,
        shares: stock.shares,
        cost_price: stock.cost_price,
        current_price: stock.current_price,
        thesis: stock.thesis,
        bull_case: stock.bull_case,
        bear_case: stock.bear_case,
      })
      .select()
      .single();

    if (stockErr) {
      console.error(`添加 ${stock.name} 失败:`, stockErr);
      continue;
    }
    console.log(`✓ ${stock.name}`);

    // Insert anchors
    if (stock.anchors?.length) {
      const anchorRows = stock.anchors.map(a => ({
        stock_id: newStock.id,
        name: a.name,
        expected: a.expected,
        frequency: a.frequency,
        latest_value: a.latest_value,
        latest_date: a.latest_date,
        note: a.note,
      }));
      await supabase.from('anchors').insert(anchorRows);
    }

    // Insert entries with staggered timestamps
    if (stock.entries?.length) {
      const entryRows = stock.entries.map(e => ({
        stock_id: newStock.id,
        type: e.type,
        content: e.content,
        price: e.price || '',
        created_at: new Date(Date.now() - e.days_ago * 86400000).toISOString(),
      }));
      await supabase.from('entries').insert(entryRows);
    }
  }

  console.log('演示数据生成完成！刷新页面查看。');
}
