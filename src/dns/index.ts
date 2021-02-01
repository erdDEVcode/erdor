import { ContractQueryResultDataType, TransactionOptions, TransactionReceipt, } from '../common'
import { stringToHex, TransactionOptionsBase, NUM_SHARDS, getAddressShard, getNameShard } from '../lib'
import { Contract, parseQueryResult } from '../contract'



interface DnsConfig {
  /**
   * An array of DNS contract addresses indexed by shard number.
   * 
   * If ommitted then default built-in mappings will be used.
   */
  shardContracts: string[],
}


/**
 * Default DNS configuration.
 * @internal
 */
const DEFAULT_CONFIG = {
  // The 256 DNS contracts indexed by shard id
  // (Found this by first finding which contracts got upgraded by deployer - erd14sq9s4y5h9z2cekz4alwtv849nz2rdruac0z6y62u6cuvmjtwkqs5sg4c0 - and then calling each one to find its shard id)
  shardContracts: [
    "erd1qqqqqqqqqqqqqpgqnhvsujzd95jz6fyv3ldmynlf97tscs9nqqqq49en6w",
    "erd1qqqqqqqqqqqqqpgqysmcsfkqed279x6jvs694th4e4v50p4pqqqsxwywm0",
    "erd1qqqqqqqqqqqqqpgqnk5fq8sgg4vc63ffzf7qez550xe2l5jgqqpqe53dcq",
    "erd1qqqqqqqqqqqqqpgqvccl0w78cvr48et3z0n06t8httkp97dkqqpsr49446",
    "erd1qqqqqqqqqqqqqpgqpzjulx7pemmknndegp2m60vgse3q99zrqqzqlg6cex",
    "erd1qqqqqqqqqqqqqpgqjr24m738s30aajdv6f5xmzuyxnss8txuqqzs59pwcn",
    "erd1qqqqqqqqqqqqqpgqhcm9k2xkk75e47wpmvfgj8fuzwaguvzyqqrqsteg8w",
    "erd1qqqqqqqqqqqqqpgql2p9sdutmz2vp6w0w5e4f3hjt9wekucvqqrs6ds80n",
    "erd1qqqqqqqqqqqqqpgq37fmv57uqkayxctplh4swkw9vfz2jawvqqyqdugcju",
    "erd1qqqqqqqqqqqqqpgqlk3vuqlqydznh94ufpt2sy9j4d0u22umqqys9qzvlh",
    "erd1qqqqqqqqqqqqqpgqup6wn264pz9c02vklwwrelhtkqydfmh0qq9qpfkpx0",
    "erd1qqqqqqqqqqqqqpgq57ekvv62qxhutavp4glfkljkayu8r8rxqq9squkq2x",
    "erd1qqqqqqqqqqqqqpgqcgwaumej906dmftsd8vkyghhpf0ry78eqqxq45ckxz",
    "erd1qqqqqqqqqqqqqpgqsf23aanx9pcw60fqmh7vqj2uduzm209aqqxsxfmvae",
    "erd1qqqqqqqqqqqqqpgq5yvykcy637980qug55v075ldq3kvntd9qq8qwraz7c",
    "erd1qqqqqqqqqqqqqpgqhygyzhn4ch4lng83cjr4nray80kl5l3sqq8sy5mjlu",
    "erd1qqqqqqqqqqqqqpgqrdj3kt29t2clcpnnfaevqemf58vtjllqqqgqcn0mgp",
    "erd1qqqqqqqqqqqqqpgqp64e3pqxwwyy93t5wp2w2jnlf4lfx3ljqqgsh8qwvz",
    "erd1qqqqqqqqqqqqqpgqlmfukwqgzttsld9h8mfm0nqtfu9y8hwjqqfq8ck4n4",
    "erd1qqqqqqqqqqqqqpgq3d0uwcsev9dj0d95zvj38xpae7g2az4sqqfsktkvta",
    "erd1qqqqqqqqqqqqqpgqu3m8g3j684t6f80usm22gfep4x9e5hngqq2qfkrgzm",
    "erd1qqqqqqqqqqqqqpgqv5r35avg7e94ymw3z2yh8rvmwxdf43clqq2s7q9dce",
    "erd1qqqqqqqqqqqqqpgq60584ze6a9udf0q387hzl7t3t87n8q9aqqtqlwxxxu",
    "erd1qqqqqqqqqqqqqpgqexv860na2t9cwgrvmrydgre23uc5g0ptqqts4tusev",
    "erd1qqqqqqqqqqqqqpgqplqkyugu5hesfqmpre80wn4x4zetdmsnqqvqxlhuq3",
    "erd1qqqqqqqqqqqqqpgqrcpy62pjcaxn383dacxt7rmdw3u5am7nqqvsfswyh4",
    "erd1qqqqqqqqqqqqqpgqlfq00tcp9yujyus8540tkk0wjdeg6588qqdqclmqcr",
    "erd1qqqqqqqqqqqqqpgqme5uy9cxp70tehlyzlmsl6kelnh3swqgqqds4j9yez",
    "erd1qqqqqqqqqqqqqpgqp8w9xf4zjnjfzn6l5pccujc3hvrp2hkcqqwqt3uyrf",
    "erd1qqqqqqqqqqqqqpgq0zq4dx9n5tu65rn39le5tqej88wsgyveqqws6234se",
    "erd1qqqqqqqqqqqqqpgq06hys9ttg4myr7pjy50y03k4uxx387yqqq0qlmmt96",
    "erd1qqqqqqqqqqqqqpgq5vwmqrwt9r60crhghrxcd2t88hprperlqq0sgryyju",
    "erd1qqqqqqqqqqqqqpgq62rsz4tq6mp0pjtwsemlxnvd9rakladsqqsqqhctlr",
    "erd1qqqqqqqqqqqqqpgqqeu05y7jfjxmc8n34my2nvfjpjm7svxpqqss5nqjaf",
    "erd1qqqqqqqqqqqqqpgq98h7d6gnfeg502j4ypp9t5s5gtdczqm4qq3q8w925k",
    "erd1qqqqqqqqqqqqqpgq83zzgjxdnt6aucpzmtxnwyqyvc3988f2qq3swyevzl",
    "erd1qqqqqqqqqqqqqpgqyayxcfwhvv02ettv0ystavn7x3lkuu4tqqjq55qd6k",
    "erd1qqqqqqqqqqqqqpgqhmfvs04uzqrjajvslgsypfjhtyyaz7esqqjspwx8zh",
    "erd1qqqqqqqqqqqqqpgqn948qmzpq8m8lu7y477xh7zlsyndtnm4qqnqzax22x",
    "erd1qqqqqqqqqqqqqpgqf9f3kvnr32u6v0nmgch76vnz46ncm7faqqnsnl5fue",
    "erd1qqqqqqqqqqqqqpgqv89a9esd099fvnfj2xyrnnhh584yydejqq5q0drw05",
    "erd1qqqqqqqqqqqqqpgqmta7xtt292599mray67za5c3rl2yc5h0qq5sfya89w",
    "erd1qqqqqqqqqqqqqpgq776u6lt7u5dr6ekn0636t3ua845gfppgqq4q4gewzt",
    "erd1qqqqqqqqqqqqqpgqy2rhzj2e0nl2mrfxfmgcskmzfl0sdjk2qq4sfkkw9x",
    "erd1qqqqqqqqqqqqqpgqpt4q6cny2y9d4qgs4lemkmqy00zwkf9pqqkq7g4ct4",
    "erd1qqqqqqqqqqqqqpgqp05fsn2zvl2tfhlrxz790ss9plkmkzmpqqks67fl65",
    "erd1qqqqqqqqqqqqqpgqccz8969nt3d9vw0a64m7zg5px847t0jsqqhqdlp209",
    "erd1qqqqqqqqqqqqqpgq64uvd2mq0d07xvt7n8tml6ecnm456qd7qqhsrmn2v7",
    "erd1qqqqqqqqqqqqqpgqzq2szpgrh95nj6quqgre2qs3x9hct827qqcq28x3p2",
    "erd1qqqqqqqqqqqqqpgqsdd0086nxte5h4qrpf9aseexzghkrn4uqqcsnlhu75",
    "erd1qqqqqqqqqqqqqpgq4mhmxv3v6878nh3ek8u34kwqqv678fv0qqeqeel8kp",
    "erd1qqqqqqqqqqqqqpgqa2re7lsvuxz2gcpnkdh7qp75teyqff8gqqes39p5ge",
    "erd1qqqqqqqqqqqqqpgqxwljm0xssccjsz4ryr52287rp797eadvqq6qemq7w0",
    "erd1qqqqqqqqqqqqqpgqs7kp40xmd4m0xsq8uywtsuxnxuzgltnuqq6sx9tsmw",
    "erd1qqqqqqqqqqqqqpgq2qg29s5d6vtx7eymm050rhmzetqcqn0dqqmqazdp6p",
    "erd1qqqqqqqqqqqqqpgqnwkzwfnm6eqt9rha4fxfz899dv5607cgqqmse7vcx8",
    "erd1qqqqqqqqqqqqqpgq784s8xvzllndal36c035x7u0wl7cq7phqquqgmqz2r",
    "erd1qqqqqqqqqqqqqpgqcuqyx0pcp5fs7qatrzg7cgng2853au6rqqusml2xsh",
    "erd1qqqqqqqqqqqqqpgqxpzxeefc6053qxp3z2sz4jf09ff7cxj8qqaqvxluq7",
    "erd1qqqqqqqqqqqqqpgqz35q0ecvzpzhyvum0etghqfcq7d6lsztqqasganmau",
    "erd1qqqqqqqqqqqqqpgqgp42l6n46urv9etd6lxa2ch2m92lclvhqq7qkllkn6",
    "erd1qqqqqqqqqqqqqpgq2u60t6gppp8uyrtutng27k9quk42xw6qqq7s63qz5v",
    "erd1qqqqqqqqqqqqqpgqm8u4r9hk7ghadf7ufjfq7ywfajxexgf8qqlq4dnhwx",
    "erd1qqqqqqqqqqqqqpgqr098hafftasr030x9jeqeqzchhad99teqqlsgw7yk5",
    "erd1qqqqqqqqqqqqqpgq6ufagmzk0w05hprdasuvgnj5vwfnkjlsqpqqse39vf",
    "erd1qqqqqqqqqqqqqpgquf7wpxtnln0a8ywf6hwy82pk5644y2c4qpqs66sj90",
    "erd1qqqqqqqqqqqqqpgqa76d5tvxqrz9w27ka3wu0ylrdgug3vnaqppqrclrk3",
    "erd1qqqqqqqqqqqqqpgqaq3kkmza02kwj0apclua9kc00e03m0tlqpps46js7e",
    "erd1qqqqqqqqqqqqqpgqw2p33cncsdtsmqhn8awne3qz37egj85jqpzqj89rfl",
    "erd1qqqqqqqqqqqqqpgq9qtkqf8sg23lf7zwhyyer2ueypkjsmnpqpzswfwfp6",
    "erd1qqqqqqqqqqqqqpgq7vl3acd94l2xqw4hglj6lx2ydhq7yy5jqprq944yj4",
    "erd1qqqqqqqqqqqqqpgqzw0c6t3puxg4rfw9ae8zc2xl3wvmqwxmqprsucygxr",
    "erd1qqqqqqqqqqqqqpgqpwx487sptz3cq3z7jszlz3lkcfdzu397qpyq5cn78c",
    "erd1qqqqqqqqqqqqqpgq3e9e0tqentvwdlratp2m2k9g8n0ljufzqpysdg6mxw",
    "erd1qqqqqqqqqqqqqpgqw82cjja5vqzx635wak76am4y7vu6nnspqp9q3j8fcc",
    "erd1qqqqqqqqqqqqqpgqwk47vfp9vme83k34n39nyw9tq3vx9d7eqp9s3cxnl4",
    "erd1qqqqqqqqqqqqqpgqtnae0xuq9dn54dhphq3y9a7ekzqr7cp7qpxqx9klh9",
    "erd1qqqqqqqqqqqqqpgq58fqfxv7vlhtjlqyl39ufj55zeh4a2jrqpxsqjs88v",
    "erd1qqqqqqqqqqqqqpgqldp0kd0e0mkxmaay9ntz2j7xytrtm6fpqp8qgdv2wr",
    "erd1qqqqqqqqqqqqqpgqyaqpjhxfzk06ptke7d4frcy2sc3w456tqp8s9feh8n",
    "erd1qqqqqqqqqqqqqpgqes2c6e53mu63znddzqxl7az4yrqa3v2eqpgqtmrnhh",
    "erd1qqqqqqqqqqqqqpgq3f4s06pp4ra9ysl2yrcnum9654krxhpmqpgsfj60qa",
    "erd1qqqqqqqqqqqqqpgqa4hmwegr9kp77ywyphps7pu0pzsdq2jxqpfqf5fmm3",
    "erd1qqqqqqqqqqqqqpgqnk3d8yunhr9wndehg3h8y3ku02wgg2deqpfs2lnctt",
    "erd1qqqqqqqqqqqqqpgqxmzt96wt6z3pk9tpga8xjgeqld6flq7xqp2qq0tamn",
    "erd1qqqqqqqqqqqqqpgq3ppm8dx4g74zsccz6lp3yyq5pvew59rjqp2scwgmu6",
    "erd1qqqqqqqqqqqqqpgqetuaw54gag7jwtkh8dtdje9j23qc9cqmqptqnq4xlg",
    "erd1qqqqqqqqqqqqqpgqfvl6j0lkppquhx2hhshdjkcd6h2nuflqqptsfgh5z6",
    "erd1qqqqqqqqqqqqqpgq83w6606edfk2t0danjsnl64u6tr2ad2sqpvqzllm39",
    "erd1qqqqqqqqqqqqqpgqjnq4qedaqd54axzqschax6ullwnk0rn2qpvspd7vxq",
    "erd1qqqqqqqqqqqqqpgqykt0f03czqj2p9qltpygzu7jwlzkaxqaqpdq07cak6",
    "erd1qqqqqqqqqqqqqpgqtj4k4u6xxxzqytf2quuy00ggjd0m4e4mqpdslhca4v",
    "erd1qqqqqqqqqqqqqpgqgrvddhuet3vuwnx3vdmshgyve62ar5paqpwqcz2uhy",
    "erd1qqqqqqqqqqqqqpgq7lrcmp7uhlxxp6jwa7s8du6zkyhl7sp0qpwsv7gf77",
    "erd1qqqqqqqqqqqqqpgqus7asxmg46uasmcmrwvyjgyhqtpusua4qp0qa3qvzc",
    "erd1qqqqqqqqqqqqqpgqkvpyh4pw97asqrgmpnhvedtwurc5tkyvqp0sr9ddmh",
    "erd1qqqqqqqqqqqqqpgq5mk4uucfw9h6y0swehrwdmachxvn4hu0qpsqy6ugcp",
    "erd1qqqqqqqqqqqqqpgqvqqpd2fyqf7ypre892smscarfagast3gqpss9qpgpm",
    "erd1qqqqqqqqqqqqqpgqur88h5n8t8whtfurlfta4x0uycppg392qp3qz628mz",
    "erd1qqqqqqqqqqqqqpgq94atq5qqluaeuewx9mdj0klhedjqmrjvqp3s2ygw27",
    "erd1qqqqqqqqqqqqqpgqna20c6fhfdl7tfrkwjtnhtxayajrckasqpjqv6fthq",
    "erd1qqqqqqqqqqqqqpgq7qs0ch9c7mphjecr59rwtk75ptss2gw6qpjsstwlrl",
    "erd1qqqqqqqqqqqqqpgqz0ycyug2rqtpyrh5p33y9vqjv95s3xmaqpnq7uz3qq",
    "erd1qqqqqqqqqqqqqpgq3qd7r8025xqxqh9vzygmllwecuxyrq4cqpnsdr8d9s",
    "erd1qqqqqqqqqqqqqpgqk6lw9w7aj5scgqh23f0juk55ydan0rzmqp5qswmhlz",
    "erd1qqqqqqqqqqqqqpgqywkkwsumtqvuncmx3exjrm9vqp76u3vyqp5sd77hec",
    "erd1qqqqqqqqqqqqqpgqydsrr9rw6wgl83dm7mgyqzr7khqp982zqp4qvx03fm",
    "erd1qqqqqqqqqqqqqpgq058jfs3fnd6tjdpg0gfdg5pd57pp672nqp4s5fm8uu",
    "erd1qqqqqqqqqqqqqpgqe4crz3fxffsag57ze6jnyn70r0zrkz6qqpkqu4wszf",
    "erd1qqqqqqqqqqqqqpgqytqyk2zxplmr0znx8q0tkwrwf6pnn5muqpksdtq5gn",
    "erd1qqqqqqqqqqqqqpgqr9nlxmhpfhasz9y7504mtp6pdqmh98p8qphqgp48xx",
    "erd1qqqqqqqqqqqqqpgqe2cmllq3zhwfuzdpdzqh7223xnc907ffqphs865ruf",
    "erd1qqqqqqqqqqqqqpgqawhqqvutzqmz2n7sn2tame55yaejx00vqpcq6qk4al",
    "erd1qqqqqqqqqqqqqpgql0x09mnzwn4hwkfpsytn9uhjyz0t5g5rqpcsrq4ykf",
    "erd1qqqqqqqqqqqqqpgqf4dpre4qv5fca6a4y3vez5rznpfh4k82qpeqxnrnts",
    "erd1qqqqqqqqqqqqqpgq6q3jfw7l7fw7vd02de2nn3rgxvnv29lkqpesdyzqf0",
    "erd1qqqqqqqqqqqqqpgqz7s9ut07qm9uh2rtzzuntnnuxrpejjscqp6q03wqv4",
    "erd1qqqqqqqqqqqqqpgq7yqrph2w055swrjjellgu55r4vjnfyklqp6skmlgft",
    "erd1qqqqqqqqqqqqqpgq9nq5dgclefa6l9np6pvtgn4mpmh8zt4nqpmqcg453e",
    "erd1qqqqqqqqqqqqqpgqfhc0kxmy8ryn5ezew0fwx7ulnfggjtzpqpmsqzza28",
    "erd1qqqqqqqqqqqqqpgqrqktg0vqjkwccz47gl5zcnvnqm6tq0srqpuqd4ueyl",
    "erd1qqqqqqqqqqqqqpgq7rxe4kmjdxpj4cfnlh96xeqva9yjx5jhqpusje0p6g",
    "erd1qqqqqqqqqqqqqpgq6amzugw7tqlqgwamdel04m437pt9rldpqpaqnj294q",
    "erd1qqqqqqqqqqqqqpgqjverqd04c8ya7fa4aumm26rxka59tvxmqpas38eme6",
    "erd1qqqqqqqqqqqqqpgqxnkx4p5u8gzxwd2ekqqsa7aktr6trphdqp7qmrjad0",
    "erd1qqqqqqqqqqqqqpgq0474ralfs6086l0a0zqz0dtf3clnpe2lqp7sz6n4wf",
    "erd1qqqqqqqqqqqqqpgqangd34sj05xsss6yp84l8j8hteqmqp36qplq93pe2z",
    "erd1qqqqqqqqqqqqqpgqsy2c35ne2a076z3cudpzgdjm2yp2uuhjqplsffqw5r",
    "erd1qqqqqqqqqqqqqpgqg9ugsf9g7vcyh6ahyfshjqjyr65y5sw7qzqqjv9vs9",
    "erd1qqqqqqqqqqqqqpgqmnk6qv550mycf7fpgvk2yfr0e8vy7jhwqzqst82qde",
    "erd1qqqqqqqqqqqqqpgqjwltr4xvafv2edc958klff3u0qlnem94qzpqrezyvl",
    "erd1qqqqqqqqqqqqqpgqz2aa6uaptw8ryf254u93xqwl4lkvu9vmqzpsxshu57",
    "erd1qqqqqqqqqqqqqpgq67c6t69pcc7dt597xmlnwjr4c55ws55qqzzqa53ykc",
    "erd1qqqqqqqqqqqqqpgqf97pgqdy0tstwauxu09kszz020hp5kgqqzzsscqtww",
    "erd1qqqqqqqqqqqqqpgqdlfj9r696jpmsakvqp7redflu472c3zgqzrqffap87",
    "erd1qqqqqqqqqqqqqpgqdyp9pfyj9ueurwxd8p42na58vsn5r9pzqzrsavy0g5",
    "erd1qqqqqqqqqqqqqpgqtprnv8gasxjkt79jn5aq9xrantj9laa6qzyq726mgv",
    "erd1qqqqqqqqqqqqqpgq0wa5j9l6urteh5k0agkkg9af364y77x5qzyssntksg",
    "erd1qqqqqqqqqqqqqpgq0k3kl9kx9swl9klueljdplv8x9m9zyf4qz9q8606yg",
    "erd1qqqqqqqqqqqqqpgq6g34lngl7w9w4yvq0fr3u72xushkssusqz9su783wc",
    "erd1qqqqqqqqqqqqqpgqf4pw79l5s9xkslyf5p06egwcnjul95ksqzxq3jjae3",
    "erd1qqqqqqqqqqqqqpgqkvve4g87rg628mvfmh0rdwe2kkqqskc4qzxs0sqpyu",
    "erd1qqqqqqqqqqqqqpgqycngxuhcjcw0wv5gpe58h0pw6g89cthdqz8qgcjydp",
    "erd1qqqqqqqqqqqqqpgq2dxd9gfff6u4pv8w9ry89cuksy34kjkcqz8sp3v7a4",
    "erd1qqqqqqqqqqqqqpgq2leexk6fwaxlxggzrnkxzruwsjzfcq2mqzgqrtedmw",
    "erd1qqqqqqqqqqqqqpgqg0vmcgrmrqnkec0fem3rf2l8468th3znqzgskqhn9j",
    "erd1qqqqqqqqqqqqqpgqefmp3c3pzwetn9xt5eav7ttxsnpg44aqqzfquzgl22",
    "erd1qqqqqqqqqqqqqpgqs0cxu3qq405r7ua8xheys8nkmz25sar3qzfsn5007n",
    "erd1qqqqqqqqqqqqqpgq8v7py8qke4kd6l3np0a2hfs3zz637782qz2quqgmtq",
    "erd1qqqqqqqqqqqqqpgq6j24n4kyyk77rdmduzzv3x5v74hg3dqnqz2snnnnjp",
    "erd1qqqqqqqqqqqqqpgq3a2fedxlf9n9ga5qt9znj5v6eyuunqm7qztqrh2kcv",
    "erd1qqqqqqqqqqqqqpgq2jq3q6k9p007v8n58k2qqetfck6pt0pcqzts0ggzv3",
    "erd1qqqqqqqqqqqqqpgq8ega5ywe9y6l2yt664cssdmeuanhnxs4qzvqjr2rhf",
    "erd1qqqqqqqqqqqqqpgqv0vvklxxzvxyq9nx0zvnlkus2a3c8267qzvs8tzgau",
    "erd1qqqqqqqqqqqqqpgqwk2a4cg4vgx0m2ummjf8x885a4y4ypdeqzdqpfmcjp",
    "erd1qqqqqqqqqqqqqpgqrmwah0xxzax9g2geyk99twlhe4yfrkgmqzdsxv2hxk",
    "erd1qqqqqqqqqqqqqpgqynp5z59pgqjnphfxg00mkpzx54an6038qzwq7apcwt",
    "erd1qqqqqqqqqqqqqpgqvney9xtjnp4duxl5y2slmg3k72g7vj5vqzwsv2kh7y",
    "erd1qqqqqqqqqqqqqpgqrnkmx4us6qw3wprmlmltuyqqvzy6zwkfqz0q76fc9l",
    "erd1qqqqqqqqqqqqqpgqx4ca3eu4k6w63hl8pjjyq2cp7ul7a4ukqz0skq6fxj",
    "erd1qqqqqqqqqqqqqpgqpmv02e6a5k7elq0qwp77t9cynhq4tt0aqzsq3hzm89",
    "erd1qqqqqqqqqqqqqpgq7fjjs979sj4pxpeuru34ku85n2j3lj2aqzssf6ftd9",
    "erd1qqqqqqqqqqqqqpgqcp8f3lv7kw4ckhq6y3yfv7awh45gf5hrqz3qf6kwhq",
    "erd1qqqqqqqqqqqqqpgqc6nz2zmkxnlfwjzg9jj8275rwdxzv859qz3sm960vv",
    "erd1qqqqqqqqqqqqqpgqcl8p0wzfluw2vvwnud57hn7drt0mma6hqzjq0znf3r",
    "erd1qqqqqqqqqqqqqpgq2yue5t96xetjkt0rfvjn5waf2zshztx8qzjsnalhyw",
    "erd1qqqqqqqqqqqqqpgq46xccpqq3vd5e9ffyt4804e9ln5rxullqznqcegn28",
    "erd1qqqqqqqqqqqqqpgqvry6tjmaa60w0k4va85a927l20k3hmmxqznsn5253p",
    "erd1qqqqqqqqqqqqqpgqze3nszzj6ngfw3g0thm30r3v4tzudexdqz5q6kztm5",
    "erd1qqqqqqqqqqqqqpgqxhe0c0d7lguv3hn267sa9zkdwrz0hc5vqz5s0tqswm",
    "erd1qqqqqqqqqqqqqpgq3lv2y7rnuvd2rux5d00cs2plhyl6vpsfqz4qldt36f",
    "erd1qqqqqqqqqqqqqpgqvrsdh798pvd4x09x0argyscxc9h7lzfhqz4sttlatg",
    "erd1qqqqqqqqqqqqqpgqkfpqz9ypt9rwxr42ygrgjg0wluep49t8qzkqyny53q",
    "erd1qqqqqqqqqqqqqpgqpvx058h36yczqsdmj4cyfn37cy0gxt43qzksqk80sq",
    "erd1qqqqqqqqqqqqqpgqrx5fz9lsd0nz526wmcjnj5cv6as3y2qkqzhq5vdr9a",
    "erd1qqqqqqqqqqqqqpgqqa39pkddyw4plx78nw686qgxatd7ukthqzhstjm6fz",
    "erd1qqqqqqqqqqqqqpgqjp8ev4hc4j3sslmqg0kyeyhtlh4vm9fpqzcqsr7nqv",
    "erd1qqqqqqqqqqqqqpgq5xlqkfxcf4rpta6mkwrufgfpgw6r3nf7qzcs0s7wuv",
    "erd1qqqqqqqqqqqqqpgqfq9na9k5jh7zpvly262z3k2yrmvdlpvfqzeq6gfvqy",
    "erd1qqqqqqqqqqqqqpgqvpc85zpq9e5edm4velyuxqejmt49ldfkqzesaj8akv",
    "erd1qqqqqqqqqqqqqpgqmsqw7qx5hpnvrkc6vummdzf60e93dswrqz6qjaffhq",
    "erd1qqqqqqqqqqqqqpgq0hsaa6whyjclpfqnyvuaqkgaxwt9ncruqz6sjc97gj",
    "erd1qqqqqqqqqqqqqpgqa7szyvngye2j78axcdcj534hp3wjprauqzmqzq3akj",
    "erd1qqqqqqqqqqqqqpgqrmeqdfgucxzx6jekzhdrhly8789hjsx6qzmsa88l6c",
    "erd1qqqqqqqqqqqqqpgq4su5u6t3khfkd6u853cudq2xqtzrksspqzuqw0pfh3",
    "erd1qqqqqqqqqqqqqpgq4tq46jzq2gfwrglvv8a6fgr44vu87wjsqzusd728gz",
    "erd1qqqqqqqqqqqqqpgqe503urc4w4t4900h7qlf4m89xn0zxed7qzaqk26fxs",
    "erd1qqqqqqqqqqqqqpgqyykmg4r0zk7j8e2vgd2u8nl57up6fkpsqzaslr3fhh",
    "erd1qqqqqqqqqqqqqpgqexzt863hvc786ccjg6qz8qmqlw5slkhhqz7qrlg85j",
    "erd1qqqqqqqqqqqqqpgqp0qwk8xc53y6c7ae3uj3msg57c65n7c4qz7sr2np5r",
    "erd1qqqqqqqqqqqqqpgqr00f20jkjzj6jdwyyfuhs6hz8dj2c2jgqzlqn22z3t",
    "erd1qqqqqqqqqqqqqpgqapjemgty9de39pf6760694gz52ekusgmqzls8zhh3a",
    "erd1qqqqqqqqqqqqqpgql47hud42jcskpggf3xzxpputfc6xprmfqrqqa98qjw",
    "erd1qqqqqqqqqqqqqpgqs44hhz7z32mjzj0sn00glncl2pf5p4kkqrqsssmkcm",
    "erd1qqqqqqqqqqqqqpgq0fun5y08yda48a6avywsds86t9cy656hqrpqfpxx5v",
    "erd1qqqqqqqqqqqqqpgqdc50p7fxtgkwdwal2xnrk2f5df97wyrdqrpslvrfdl",
    "erd1qqqqqqqqqqqqqpgqt8t6hj0mxxmwj6zrwlldz9n7pw9eutuaqrzqptmkpn",
    "erd1qqqqqqqqqqqqqpgq42cn7rfgjd7gq859thd5x8sehdm7c6nwqrzs5hcytp",
    "erd1qqqqqqqqqqqqqpgqfuh0mnpdf4ej2pfdd63lt46gyny0senfqrrqekdsqp",
    "erd1qqqqqqqqqqqqqpgqypq2ux9gdyvw4lkfy57sgprzeaxyu3saqrrsrj7gxj",
    "erd1qqqqqqqqqqqqqpgq5nqp808kuwpqfkyqdkns29lv0rhxdz6pqryqpvc27m",
    "erd1qqqqqqqqqqqqqpgq7e03tpmhuqhacqdfaukn50wkllxpmzetqrysx5229e",
    "erd1qqqqqqqqqqqqqpgqfnsltcmhdlyyjqlhv8sgr0p3rzzs839mqr9qauqchs",
    "erd1qqqqqqqqqqqqqpgqgpdjf5ptrge0leahucfhagvkvmxnknfkqr9sw06gm0",
    "erd1qqqqqqqqqqqqqpgqjw7ytmn5jp28zngmsq9gdsgslp49s3wdqrxq8jl2gd",
    "erd1qqqqqqqqqqqqqpgqg3nvuz35s762vea4gyww5nn0h87r3987qrxsrezt2c",
    "erd1qqqqqqqqqqqqqpgqhjhhs4920jfxkastaf9ze8yyd4jxws6wqr8qz6tls7",
    "erd1qqqqqqqqqqqqqpgqdpkgt7da7xdpfzc99lwd8fcp9aqcem3nqr8stwwtxd",
    "erd1qqqqqqqqqqqqqpgq5pua3suerg6c8de4vucexrq2c0d5xctjqrgqcl553h",
    "erd1qqqqqqqqqqqqqpgqyt7avg7te9mngysa07dw04d49agzd9deqrgsgql9nq",
    "erd1qqqqqqqqqqqqqpgqvw7yxu6055ucua2ytnfd04drdju2aun9qrfqv49wtd",
    "erd1qqqqqqqqqqqqqpgq4aae5mpfxnywf5yapjm2c2nudgg5ewl3qrfs3jt9md",
    "erd1qqqqqqqqqqqqqpgq9ddcdjrq55w6kp8pvfa8d7m8dsyrjzjuqr2qgw4j30",
    "erd1qqqqqqqqqqqqqpgqs3kh4kjyckz5zwqzy54spxx27zss6rvvqr2s99a627",
    "erd1qqqqqqqqqqqqqpgqfka5dqs398kumyqfvcpthd0f43x6htq7qrtq0gadhq",
    "erd1qqqqqqqqqqqqqpgqdsg4wn28q8j8w5ct5s2cxr04spjul8cuqrts25h9th",
    "erd1qqqqqqqqqqqqqpgq9g7umcgkf8jcvv6u93g8cl78znt4afa9qrvqjzfx7h",
    "erd1qqqqqqqqqqqqqpgqzsqek20mul9t07kwj8fswjl85qnmysweqrvs4u6qq3",
    "erd1qqqqqqqqqqqqqpgqe5f8pf52umknu489z4tuat3h4tql3e9mqrdqe9drlh",
    "erd1qqqqqqqqqqqqqpgqnp5x7hvss26dufx5p0csls30g7wuquhxqrdsyeep4z",
    "erd1qqqqqqqqqqqqqpgqhh8w5q9mvv9tn6w9e768htmj4t9y4390qrwq0zdztk",
    "erd1qqqqqqqqqqqqqpgqx4m8kz3jmespyr47tyrhgrmzsv9qlk32qrwscajfu9",
    "erd1qqqqqqqqqqqqqpgqz5gjr6e8c2qcpqawepr0t2urnkq07p4aqr0q2wwhgd",
    "erd1qqqqqqqqqqqqqpgq8pa6mkfyt8lvq6cl3ppgnskn9ms03ne3qr0sxts88q",
    "erd1qqqqqqqqqqqqqpgqjrzh4wfkkkmkk7ke3upqnmmr3amq7va2qrsqpvf8ap",
    "erd1qqqqqqqqqqqqqpgqfkslzjt70pz7py3vjemvmshewgemvglmqrss6lxagz",
    "erd1qqqqqqqqqqqqqpgqyykpxr693gc3mpvvc4k3frq8m7eeguuxqr3q98aec4",
    "erd1qqqqqqqqqqqqqpgqq68jetqwtapzmstwnz7ex8s9tqy25kheqr3s95jvp8",
    "erd1qqqqqqqqqqqqqpgqr3pqqnz626ja7sp2j35mjq9qwt25lyf3qrjqmqd8mt",
    "erd1qqqqqqqqqqqqqpgqqdkg0chrthsjm30u4rlw8etklrp3qx3aqrjs67ek26",
    "erd1qqqqqqqqqqqqqpgqcqc0dls8kdykj2gk2ckcdkrehf5m7wrrqrnqr4gfj2",
    "erd1qqqqqqqqqqqqqpgq29pf3z3rt23smjdlppnp0w65sq0hyh92qrns7vqfm9",
    "erd1qqqqqqqqqqqqqpgqm0gn9hh52s9qqusxxye2rxlqcphfscuwqr5q6fp9aq",
    "erd1qqqqqqqqqqqqqpgq5wqgz3tkrr90pdq07sh2qkgvxdujpsmwqr5svzyv2n",
    "erd1qqqqqqqqqqqqqpgqp58nd7xs43zqr43s2aq2z3km4mqmgjvjqr4qheknh9",
    "erd1qqqqqqqqqqqqqpgq8wrk96xm882m478srwkwlnr9ugjfvhqwqr4sawqjp9",
    "erd1qqqqqqqqqqqqqpgq4wek8nyjsgd6jr3ctj0zzkgvjts8me6wqrkqfuakgl",
    "erd1qqqqqqqqqqqqqpgqlyfmgtd30x36zdpuxydvpkydtvupf2hsqrkselgsct",
    "erd1qqqqqqqqqqqqqpgq45p6f3pem37kjgkh238a0urmayj7k49dqrhq38ehsj",
    "erd1qqqqqqqqqqqqqpgqc0htpys8vhtf5m3tg7t6ts2wvkgx3favqrhsdsz9w0",
    "erd1qqqqqqqqqqqqqpgqrm4lhgjag99lm5k0nrqf0fhu9avl56n2qrcq5snsy8",
    "erd1qqqqqqqqqqqqqpgqsuxg5m7p4ka5d5q8x2t9x6nxm5356chfqrcs9r4mjv",
    "erd1qqqqqqqqqqqqqpgqez3jrxx3krhncmzhmzf8ksnjvmt0x6vrqreqvees8p",
    "erd1qqqqqqqqqqqqqpgq05sran5e9w3kwzu4mkz7prtlvqeez583qresvv2hw5",
    "erd1qqqqqqqqqqqqqpgq3m44gud3g9z5p7xjevm80dk2g504fhzhqr6qxpam9y",
    "erd1qqqqqqqqqqqqqpgqrequgw4plxarc0rcu49gtxc7874g7waxqr6s70ctuw",
    "erd1qqqqqqqqqqqqqpgqtxf5ra4qkj4cmgv8q070w8g2cyd8y56jqrmq9xndy3",
    "erd1qqqqqqqqqqqqqpgq3uxwmwtgmms6jytn3vzlw89vrxxe9xjwqrmsjex283",
    "erd1qqqqqqqqqqqqqpgqs6d64ffr3m4veck8cuvkp8zgn2gflmemqruqwrhxsf",
    "erd1qqqqqqqqqqqqqpgqt9mexedq83vc8fdqjfknuend4auj7gewqrusuxh0rn",
    "erd1qqqqqqqqqqqqqpgqwq64a8w0gqqnxchm572tj38uda9elqw7qraq88s7jt",
    "erd1qqqqqqqqqqqqqpgqzwl6axaq2kfjaglfsrm3eqc0rs3cn85rqrast276y9",
    "erd1qqqqqqqqqqqqqpgq3e4gtyegzqttlfqau6wtzm7vg4hl2fjmqr7qa5p8vd",
    "erd1qqqqqqqqqqqqqpgqf45egn6zvc39q35m5ffw8x4h8c9p2929qr7ss6gumf",
    "erd1qqqqqqqqqqqqqpgqlkk3dj24u5gfn75ymsd3g490qya7xzumqrlq03ed6p",
    "erd1qqqqqqqqqqqqqpgqd3z70c44v7g9makg800l3r3gx3e5a97xqrlslqwqa9"
  ]
}



/**
 * Interface for working with Elrond DNS.
 */
export class Dns extends TransactionOptionsBase {
  _config: DnsConfig

  /**
   * Constructor.
   * 
   * @param config DNS configuration.
   * @param options Base transaction options.
   */
  public constructor(transactionOptions?: TransactionOptions, dnsConfig?: DnsConfig) {
    super(transactionOptions)
    
    this._config = dnsConfig || DEFAULT_CONFIG

    // check length
    if (256 > this._config.shardContracts.length) {
      throw new Error('Not enough address provided')
    }

    // check for duplicates
    const dup: Record<string, boolean> = {}
    this._config.shardContracts.forEach(addr => {
      if (dup[addr]) {
        throw new Error(`Duplicate address: ${addr}`)
      }
      dup[addr] = true
    })
  }

  /**
   * Resolve given DNS name.
   * 
   * @param name Name to resolve, in the form `XXX.elrond`.
   * @param options Overrides for options passed in via the constructor.
   * 
   * @return Empty string if name is not registered.
   */
  public async resolve (name: string, options?: TransactionOptions): Promise<string> {
    const mergedOptions = this._mergeTransactionOptions(options)

    // get contracts for right shard
    const shardId = getNameShard(name)

    const c = await Contract.at(this._config.shardContracts[shardId], mergedOptions)

    const ret = await c.query('resolve', [stringToHex(name)])
    if (ret.returnData.length) {
      return parseQueryResult(ret, { type: ContractQueryResultDataType.ADDRESS }) as string
    }

    return ''
  }


  /**
   * Register a DNS name for the sender.
   * 
   * @param name The name to register.
   * @param options Transaction options overrides.
   */
  public async register(name: string, options?: TransactionOptions): Promise<TransactionReceipt> {
    const opts = this._mergeTransactionOptions(options, 'sender')

    // get all DNS contract in the same shard as sender
    const shardId = getNameShard(name)
    
    // do it!
    const c = await Contract.at(this._config.shardContracts[shardId], opts)

    return await c.invoke('register', [ stringToHex(name) ], { 
      gasLimit: 100000000
    })
  }
}

