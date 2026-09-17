# 潜历 1.0 隐私事实与 App Privacy 预审

审计日期：2026-09-17（Asia/Shanghai）。审计对象：本地 QIAN `IOS` 分支，HEAD `acc158d1333f30f8a3a6fb690682abc04218f029` **及当时未提交工作区**。官网文案针对当前实现，不代表已经发行。未修改 QIAN，也未执行 App Archive、真机权限测试、抓包或 App Store Connect 操作。

## A. 实际行为摘要与审计范围

SwiftUI + SwiftData，本机数据库，`cloudKitDatabase: .none`，空 entitlements。用户无账号；目录、目的地图片和地图轮廓来自 bundle。存在可选前台定位、系统照片选择／原文件读取、保存分享图片的 add-only 权限、本地通知、用户发起的外部链接和文件导出。唯一解析到的第三方包为 ZIPFoundation 0.9.20（revision `22787ffb59de99e5dc1fbfe80b19c97a904ad48d`），用于本地 ZIP。

已读取要求的 `AGENTS.md`、`docs/handoff.md`、`docs/final-audit-fixes.md`、`docs/unified-trips.md`、`docs/shop-review.md`、`docs/map-review.md`、`docs/color-system.md`；核对 Info.plist、生成 Info 的 project.yml / project.pbxproj、entitlements、App 与依赖隐私清单、QianliApp、Models、Services 和 Settings / Plan / Sites / Go 页面及调用入口。另全量搜索 `ios/Qianli/**/*.swift` 的网络、权限、追踪、账号、标识符、CloudKit、HealthKit、EXIF/GPS、外部链接、文件与偏好 API；检查 Package.resolved 和本地 ZIPFoundation Sources。下表的“未发现”限定为此代码与依赖范围，不推断开发者在线后台状态。

与输入信息／旧文档的差异：

- **最低系统是 iOS 26.0**，不是 17+。`ios/project.yml:5`、`project.pbxproj:1319` 与 9 月 17 日 handoff 一致。
- **有定位功能**，不能写成不申请定位权限。`LocationService` 的授权变更回调在已授权时也会 `requestLocation()`；已有权限的用户打开创建该服务的表单时，可能取得一次位置，不应承诺每次取位置都必须再点击。
- **存在 ZIPFoundation**，不能写“没有第三方库”。它不等同于分析／广告 SDK。
- 手写 Info.plist 不含用途说明，但 project.yml 和 Xcode build settings 会生成定位、照片读取、照片添加三项用途说明，不能只读静态 plist 得出“无权限”。
- `handoff.md` 的 256 MiB 总包上限已经落后于实际 `TripBackupIO`：当前没有总字节上限；仍限制单 JSON 16 MiB、单照片 32 MiB／12000px、5000 文件条目和 20000 模型记录。网页不承诺旧总包上限。
- PhotoLibraryImport 没有指定 `PHImageRequestOptions.version = .original`，PhotosPicker 也没有指定 `.current` 编码偏好。准确说法是“保存系统交付的文件字节”，不能保证拿到相册最初未经编辑或未经系统转码的文件。
- 邮箱在 `PrivacyPolicyView:60` 已正式展示：`zzzv0325@163.com`。用户本轮确认继续使用，支持邮件仅处理 App 使用问题；未来域名邮箱尚未配置。

### 证据索引

下列路径相对于 QIAN 仓库。行号针对本次工作区；函数名用于后续代码变化后定位。

| 编号 | 文件与位置 | 关键事实 |
|---|---|---|
| E1 | `ios/Qianli/QianliApp.swift:77`，ModelContainer | 六类模型；正式数据库明确 `.none`，测试开关 Release 恒 false |
| E2 | `ios/Qianli/Models/LocalModels.swift:12` | Trip / Dive / Photo / Checklist / SavedDestination / Template 字段；级联删除；UUID；imageData externalStorage |
| E3 | `ios/Qianli/Views/Settings/SettingsView.swift:13`、`:74`、`:118` | 本机出发地、证书、提醒规则、默认模板；备份入口与个人／关于区 |
| E4 | `ios/Qianli/Services/PhotoLibraryImport.swift:17`、`:31` | 所选 itemIdentifier 的 PHAsset 查询；PHImageManager；networkAccessAllowed；Data fallback |
| E5 | `ios/Qianli/Services/TripPhotoStore.swift:52`、`:189`、`:217` | Application Support 缓存；原字节提交；尺寸检查、缩略图与删除 |
| E6 | `ios/Qianli/Views/Plan/TripDetailView.swift:463`、`:601`、`:652`、`:799` | PhotosPicker；分张保存；行程与图片删除 |
| E7 | `ios/Qianli/Services/LocationService.swift:31`、`:54`；`Views/Plan/AddTripSheet.swift:42`、`:169`、`:305` | WhenInUse、单次定位、内存排序、已有权限回调 |
| E8 | `ios/Qianli/Services/TripReminderScheduler.swift:14`、`:137`、`:185`；`Views/Plan/TripDetailView.swift:281` | 通知授权、本地 trigger、tripID、过期跳过和取消 |
| E9 | `ios/Qianli/Services/TripExport.swift:10`、`:186`、`:268` | ZIP JSON v3 字段和原图文件；不导出个人偏好 |
| E10 | `ios/Qianli/Services/TripBackupIO.swift:7`、`:55`、`:103` | ZIPFoundation、未加密、清单／SHA-256／CRC 校验、限制 |
| E11 | `ios/Qianli/Services/TripImport.swift:32`、`:183` | 先校验，再独立 context 恢复；UUID 去重、缺图补齐、单次 save／rollback |
| E12 | `ios/Qianli/Views/Settings/TripBackupSection.swift:29`、`:228`；`Services/TripDocumentExporter.swift:19` | 导出／恢复真实按钮；UIDocumentPicker export asCopy；安全作用域文件访问 |
| E13 | `ios/Qianli/Services/ExternalMapSearch.swift:52`、`:63`、`:77`；`Views/Sites/DestinationDetailView.swift:860` | 原生 URL 与 Web fallback，目的地＋类别搜索，不含用户坐标 |
| E14 | `ios/Qianli/Views/Plan/ShareComposerView.swift:117`、`:275`、`:304`；`Views/Settings/ActivityShareSheet.swift` | 生成 UIImage、系统分享、addOnly 相册写入 |
| E15 | `ios/Qianli/Services/CatalogStore.swift:10`；`Services/DestinationPhotoLoader.swift:24`；`Views/Settings/DataSourcesView.swift:18` | bundle 读取、ImageIO 方向变换、来源外链 |
| E16 | `ios/project.yml`；`ios/Qianli/Info.plist`；`ios/Qianli/Qianli.entitlements`；`ios/Qianli.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` | 生成权限说明、无 CloudKit/APNs entitlement、唯一依赖 |
| E17 | `ios/Qianli/Resources/PrivacyInfo.xcprivacy` | tracking false、空 collected data，UserDefaults / FileTimestamp 理由 |
| E18 | `ios/Qianli/Views/Settings/PrivacyPolicyView.swift:60`；`Services/ShopFeedbackMail.swift`；`Views/Sites/ShopFeedbackSheet.swift`；`docs/shop-review.md` | 正式联系邮箱；旧商户反馈工具无现行产品调用入口 |
| E19 | `ios/Qianli/Views/Plan/TripDetailView.swift:401`、`:497`、`:570`；`Views/Settings/ChecklistTemplateViews.swift:218`；`Views/Sites/DestinationDetailView.swift:958` | 潜次／待办滑动删除、整趟删除、模板删除、取消收藏 |

### 隐私事实表（35 项）

| # | 问题 | 结论与依据 |
|---|---|---|
| 1 | 是否需要账号 | 不需要；无登录／注册／认证代码。E1–E3、E18 |
| 2 | 服务器或自建后端 | 当前 iOS 功能未发现后端客户端或服务端 API；不能据源码断言运营者从未使用任何后台。E1、E15、全局检索 |
| 3 | 是否上传用户数据 | 无自动上传。用户主动分享、导出到云盘、发支持邮件时，数据会交给对应服务／收件人；不能写“任何数据绝不离开设备”。E12、E14、E18 |
| 4 | CloudKit | 不使用潜历 CloudKit；正式 container `.none`，entitlements 空。E1、E16 |
| 5 | iCloud Drive | 无自有 ubiquitous container／自动同步；用户可在系统文件界面选 iCloud Drive 保存／打开 ZIP，属于用户选择的文件提供者。E12、E16 |
| 6 | 访问照片库 | 是，用户选择照片导入，以及用户保存分享图。E4、E6、E14 |
| 7 | 照片 API／范围／原图／metadata／上传 | PhotosPicker `.images`、PHAsset.fetchAssets 限选中 ID、PHImageManager.requestImageDataAndOrientation，失败回退 loadTransferable(Data)。不枚举全库；保存系统交付字节／格式。读取尺寸、格式、显示方向，无 GPS 字段提取；原文件 metadata 不剥离，ZIP 保留。系统可从 iCloud Photos 取回，App 无上传。E4–E6、E9、E15 |
| 8 | 定位权限 | 是，可选 WhenInUse；用于附近潜点排序，坐标不落库。已有权限时授权回调也会单次请求；无后台定位。E7、E16 |
| 9 | 通知权限 | 是，alert/sound/badge；用户开启行程提醒且有未来节点时请求。E8 |
| 10 | 本地或远程 Push | 本地 UNCalendarNotificationTrigger；无 APNs 注册、device token、aps-environment。日期日历运算不等同系统日历访问。E8、E16 |
| 11 | 相机 | 未发现 API／用途说明／拍摄入口；仅选择已有图片。E6、E16、全局检索 |
| 12 | 联系人 | 不读取通讯录；潜伴是手填字符串。E2、全局检索 |
| 13 | 系统日历 | 不访问 EventKit；Foundation Calendar 用于本地日期计算。E8、全局检索 |
| 14 | 麦克风 | 未发现录音接口或权限。E16、全局检索 |
| 15 | 蓝牙 | 未发现 CoreBluetooth 或权限。E16、全局检索 |
| 16 | Analytics | 无内置分析 SDK／上传代码；后台是否另行使用 Apple 提供的数据待确认。E16–E18、全局检索 |
| 17 | Crash Reporting | 无集成崩溃上报；本地 print／fatalError 不等同遥测。Apple／TestFlight 管理后台使用情况不能由源码证明。E1、E12、E16 |
| 18 | 第三方 SDK | ZIPFoundation 0.9.20，本地压缩／解压；无其他解析依赖。系统 Apple 框架另列。E10、E16 |
| 19 | 广告或 Tracking | 无广告、IDFA、数据代理、跨 App 追踪实现；manifest tracking false。E17、全局检索 |
| 20 | ATT | 无 AppTrackingTransparency／ATTrackingManager 调用和用途说明。E16、全局检索 |
| 21 | 设备标识符 | 未发现 IDFA、IDFV、持久安装 ID 或推送 token。高德 URL 的 Qianli/sourceApplication 是固定 App 名，不是设备 ID。E13 |
| 22 | 用户 ID | 无账号级用户 ID；UUID 是行程／照片等记录和暂存任务编号，仅本机关联与备份去重。E2、E9、E11 |
| 23 | 网络请求 | 未发现 URLSession、URLRequest、WebSocket、远程数据库等业务请求。系统与外部操作仍能联网，不能写“完全不联网”。E4、E12–E15 |
| 24 | 请求服务与内容 | 系统 iCloud Photos 取回选图；用户选文件提供者读取／保存备份；主动地图／资料 URL；系统分享。支持邮件是外部邮件客户端操作。无主动后台上报。E4、E12–E15、E18 |
| 25 | 地图服务 | 中国大陆：高德、百度、Apple；其他：Google、Apple。App 内轮廓地图为离线数据，并未嵌入这些厂商地图 SDK。E13、E15 |
| 26 | 传递位置或目的地 | 给外部地图传目的地名＋“潜店／住宿”等搜索词，部分附固定 App 来源；不传用户当前位置／记录 UUID／照片。外部服务自己的位置权限另算。E13 |
| 27 | 分享导出 | 系统分享生成的卡片 UIImage、保存卡片到相册、系统文件界面导出 ZIP。不是 App 内 UGC 上传。E12、E14 |
| 28 | ZIP 内容 | 行程 UUID、目的地 ID／名称、起止日期／时间、兼容状态、活动、笔记、创建时间和提醒标志；潜次日期／地点／深度／时长／能见度／潜伴／备注；待办顺序／完成态；照片 ID／说明／时间及可选文件；收藏；自定义模板；版本、导出时间和校验清单。不含个人偏好。E9–E10 |
| 29 | Restore 行为 | 文件本地检查后预览确认，独立 context 单次 save；已有行程不覆盖，只补同一照片 UUID 的缺失数据；收藏目的地去重、模板 UUID 去重；冲突跳过；新行程提醒关闭；失败／提交前取消 rollback。E11–E12 |
| 30 | 如何删除 | 行程详情底部整趟删除并级联／清缓存／取消提醒；单条潜次及待办滑动删除；照片单独确认；模板删除；目的地取消收藏。无一键全清／回收站／账号注销。E6、E19 |
| 31 | 卸载是否删除 | iOS “删除 App”清除本机 App 数据；“卸载 App”保留数据。外部 ZIP、系统相册副本、设备备份单独管理；不能承诺删除 App 等于抹除所有副本。E6、E12、Apple 存储文档 |
| 32 | 未成年人 | 无年龄采集、儿童账号或专门处理路径；不是据此确认 App Store 年龄评级。E2、全局检索 |
| 33 | 跨境 | 无开发者自动传送本地库的实现；外部地图、云盘、Apple 或邮件服务的处理地区不可由本仓库确认，不声称全球零跨境。E4、E12–E15 |
| 34 | Apple Data Types | 核心功能纯本机处理，按 Apple 定义不等于开发者收集。支持邮件和 Apple 后台诊断另作确认，见 B。不能仅据空 manifest 完成全业务标签。 |
| 35 | Manifest 与实现 | 当前 App 源码声明基本相符：无 tracking／自动收集，CA92.1 对应本 App UserDefaults，C617.1 对应 App 容器文件属性；依赖另有 FileTimestamp/0A2A.1。最终签名 Archive 聚合报告未验收，见下节。E17、ZIPFoundation manifest |

### PrivacyInfo.xcprivacy 核对

App 清单：`NSPrivacyTracking=false`；tracking domains 和 collected data 均空；UserDefaults `CA92.1`，FileTimestamp `C617.1`。设置使用 AppStorage / UserDefaults 本 App 偏好；TripExport 对自身照片文件 `attributesOfItem`。未发现磁盘容量、系统启动时间、键盘枚举等其他 required-reason API 调用。

本地 ZIPFoundation 源码及已有 Debug 产物中有其独立 manifest：FileTimestamp `0A2A.1`，tracking false、collected data 空。库包含 lstat／时间戳访问，清单与文件归档能力相符。已有 Debug App 中也存在 App 自身及 ZIPFoundation 清单；这仅证明这些本机已有产物含文件，不证明未来发行 Archive 一定正确。

权限用途说明在 project.yml / project.pbxproj 生成。静态 Info.plist 的 `UIFileSharingEnabled` / `LSSupportsOpeningDocumentsInPlace` 允许系统文件交互，不赋予潜历自动云同步能力。照片读取用途说明存在，但未发现显式 `.readWrite` 授权请求；选择器仍可交付选定文件，PHAsset 路径能否取到对象依系统授权与资源状态，失败走 fallback。不要承诺不需任何照片权限，也不要承诺必须授予全相册权限。

## B. Apple App Privacy 初步判断

按 [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)（2026-09-17 核对），只在设备内处理不属于标签中的收集。向设备外传输且可持续访问需另评估；支持请求是否可免披露必须满足 Apple 全部条件。Apple 自身收集与开发者取得使用的数据要分开判断。

**结论：核心 App 功能可支持“Data Not Collected”的初判，但整个发行流程尚不能无条件定案。** 用户已确认邮件仅处理 App 使用问题；尚未确认邮件保留／删除规则和 App Store Connect／TestFlight 用户级诊断使用。网站邮件帮助不应自动当作 App 内持续收集，也不能因“自愿”两字直接免报。

下表 `Linked` 的 No 表示“未发现开发者收集后的用户关联”，不表示本地模型彼此不关联。Needs confirmation 行的 Yes 以确实收到可识别邮件或诊断为条件，不假定匿名。

| Data Type | Collects | Linked to user | Used for tracking | 依据 |
|---|---|---|---|---|
| Contact Info | Needs confirmation | Yes（若收到支持邮件） | No | App 不采集姓名／邮箱／电话；支持邮箱收到发件人信息，是否计入标签或符合免披露需结合实际流程 |
| Health & Fitness | No | No | No | 不用 HealthKit；潜次深度／时长等仅本地，未上传 |
| Financial Info | No | No | No | 无支付或金融信息处理；目录费用是公共内容 |
| Location | No | No | No | Core Location 内存排序；原图可能带 GPS 但未上传；外部地图不含当前位置 |
| Sensitive Info | No | No | No | 无专门采集；本机自由笔记不转成开发者收集 |
| Contacts | No | No | No | 无通讯录接口；潜伴手填仅本地 |
| User Content | Needs confirmation | Yes（若收到支持邮件／附件） | No | 行程、照片、笔记本地；系统分享由用户选择。Customer Support / Emails / 附件的披露取决于支持流程；不要求默认发送备份 |
| Browsing History | No | No | No | 无浏览轨迹采集；点击外链不回收第三方浏览行为 |
| Search History | No | No | No | 搜索在本地，无搜索上传；用户发起地图查询另由地图处理 |
| Identifiers | No | No | No | 无账号 ID／设备 ID；本机 UUID 仅记录用途 |
| Purchases | No | No | No | 未发现 StoreKit／交易记录读取 |
| Usage Data | No | No | No | 无分析事件上报；若负责人使用额外 Apple 报表，应重新确认其范围 |
| Diagnostics | Needs confirmation | Yes（若取得与身份关联的反馈／日志） | No | 无自建崩溃 SDK；不能凭源码确认 Apple 后台取得的数据或人工附件。若仅匿名汇总，应据实际材料改判 |
| Other Data | No | No | No | 偏好、模板等仅本地；没有额外上传流程 |
| Surroundings / Body | No | No | No | 无环境扫描、手部或头部追踪 |

参考：[Apple 第三方 SDK 要求](https://developer.apple.com/support/third-party-SDK-requirements/)、[Required Reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)。没有在官网政策正文强行加入 App Store Connect 术语，也没有提交任何 App Privacy 答案。

## C. 权限摘要

| 权限／资源 | 实际请求 | 用途 | 时机 | 可选 |
|---|---|---|---|---|
| Location When In Use | Yes | 附近潜点本机距离排序 | 未授权时点“距你最近的潜点”；已有授权服务回调可取位置 | Yes，可手选目的地 |
| Photos 选择／读取 | Yes（选择器和限选中 ID 的读取）；无显式 readWrite 授权调用 | 取回用户选中的图片字节 | 行程“添加照片” | Yes |
| Photos Add Only | Yes | 保存生成的分享卡片 | 点击“保存图片” | Yes，可取消 |
| Notifications alert/sound/badge | Yes | 行程出发前本地提醒 | 单行程开启且有未来节点，尚未授权时 | Yes |
| 文件访问 | 用户选择文件的 security-scoped 访问，无全盘权限 | ZIP 导出、ZIP／JSON 导入 | 系统文件选择／保存界面 | Yes |
| Camera / Microphone / Contacts / Calendar / Bluetooth / HealthKit / ATT | No | 无相应功能 | 无 | 不适用 |
| Remote Push / CloudKit | No | 无 capability／注册 | 无 | 不适用 |

## D. 第三方服务摘要

| 服务 | 到达方式／数据 | 开发者侧边界 |
|---|---|---|
| ZIPFoundation 0.9.20 | 本地调用处理 JSON／照片 ZIP | 不联网，不收集，不是远程备份服务 |
| Apple Photos / iCloud Photos | 系统选择图片，必要时网络取回；可添加分享图 | 系统服务行为，不是潜历 CloudKit |
| Apple 通知／定位 | UNUserNotificationCenter 与 CoreLocation | 本地提醒及短时排序；不使用远程 Push |
| Apple / Google / 高德 / 百度地图 | 用户选择后打开含目的地名称和类别搜索词的 URL | 无 SDK、无传当前位置、无返回商户抓取；第三方自身权限另算 |
| 系统文件与第三方 File Provider | 用户选定保存位置／备份文件，可含完整原图及 metadata | 无潜历账号／服务器；云端位置由用户选 |
| 系统分享接收应用 | 用户选定接收者，接收生成的卡片 | 不是潜历社区；不自动发送 |
| 外部资料网站 | 用户点击交通、资料来源、许可 URL | 不把本机记录附到 URL；网页自身处理另算 |
| 支持邮箱（163.com） | 用户自行发信，发送方邮箱／正文／附件 | 已确认仅用于 App 使用问题；保留期限未定，不编造 |
| Apple 设备备份 | 操作系统根据用户设置备份 App 数据 | 源码未排除本地库／照片；不保证从不进入系统备份 |

系统规则依据：[iCloud 备份内容](https://support.apple.com/en-au/108770)、[iPhone 存储／卸载与删除](https://support.apple.com/en-au/108429)。

## E. 仍需确认与实际限制

1. **未回答的运营事实**：是否取得并使用 App Store Connect／TestFlight 提供的用户级诊断、反馈或其他报表，以及其身份关联程度。这影响最终 Diagnostics 等标签，源码无法确认。
2. **支持邮件保留／删除规则**：用户确认用途和当前邮箱，但未给出固定期限或删除流程。因此网页只说明用途、可联系处理请求，不承诺具体清除时限。未来邮箱更换需同步 App 内政策与官网。
3. **发行包复核**：最终签名 Archive 的用途说明、entitlements、依赖和聚合 Privacy Report，不能用本轮静态审计或旧 Debug 文件代替。
4. **系统照片取回边界**：真机有限照片权限、拒绝权限、iCloud 原图与格式 fallback 未在本轮交互验证。网页只承诺保存系统实际提供的字节。
5. **定位触发描述**：已有授权下打开表单可能产生一次定位，已反映到官网；无后台持续定位。原 App 简版政策的“只有点…”过于绝对，本轮不改 App。
6. **备份文档漂移**：handoff 的旧总包 256 MiB 限制与源码不符；本轮以实际单项限制为准，未修改 QIAN 文档。
7. **照片 metadata 与备份副本**：原字节未去 EXIF/GPS，向他人交付 ZIP 即交付其中 metadata；删除 App 内记录不能删除外部副本。正文已解释，无新增处理功能。

官网政策可独立阅读，未保留 TODO。上述发行／运营确认项不伪装为已通过，也不把不存在的能力写入正文。

## F. 官网验证

- `npm install` 完成：272 packages audited，0 vulnerabilities；已有两个依赖的安装脚本出现 allow-scripts 提示，未改执行策略，随后构建正常。
- `npm run build` 完成：16 个 Astro 文件检查，0 errors、0 warnings、0 hints；5 个静态页面生成成功。
- `/qianli/privacy/`、`/qianli/support/` 均 HTTP 200，正确 title / description / canonical，无 TODO 或草稿，已移除 noindex。
- 两页分别核对 1440 / 1024 / 768 / 430 / 390 / 320px，实际 viewport 与页面 scrollWidth 相等，主要内容无越界元素。桌面与 320px 正文及备份操作步骤已目视复核；目录点击及页面互相跳转正常。
- 检查隐私页 27 个、支持页 20 个链接：站内路由 HTTP 200，所有目录／跳转 fragment 对应有效 ID；mailto 与已确认邮箱一致（未发送邮件）。
- 浏览器 Console 无 warning / error；文档页 scroll-behavior 为 auto，无动画、图片或客户端脚本。
- `git diff --check` 通过。npm install 未改变 package-lock.json；首页、About、产品页源文件、DNS / Pages / 域名配置均无本轮修改。
- QIAN 仓库只读；本轮不包含 App 运行、真机或发行验收。

### 关键源码快照校验

以下 SHA-256 用于识别包含未提交修改的审计快照，不把 HEAD 当成完整源码快照。

| QIAN 文件 | SHA-256 |
|---|---|
| `ios/project.yml` | `09925078469fb387ae3b63507ad628cf1515a7832f50c22cefcdf03292ddd0d0` |
| `ios/Qianli/QianliApp.swift` | `5b854d1e7a61496ef0d9033a042ca1a66bf4910fcff95278c6ff1bc6635250b9` |
| `ios/Qianli/Services/LocationService.swift` | `ea8c65b29d5c7f0912f66b0af0f9b70e41f8d796427d6c86b928841e7e267089` |
| `ios/Qianli/Services/PhotoLibraryImport.swift` | `1e7fa3858b44cae4953c0235f0308049e19920191f099f5bbb35fbed116167f8` |
| `ios/Qianli/Services/TripBackupIO.swift` | `b8a0c37189962e08efa939f8e87f74f77b9ad5da9b1a715ab5b69ab4b2c263ed` |
| `ios/Qianli/Views/Settings/TripBackupSection.swift` | `efe0fdac5931bffe7cb323a4a6ff55e90de281a384f7545f505a30a1fbf00536` |
| `ios/Qianli/Services/TripDocumentExporter.swift` | `7b9d84cca17264a93c5794e66c211cdf0b0fa9475bf869b695c9dd837eab3401` |
| `ios/Qianli/Resources/PrivacyInfo.xcprivacy` | `39ac407928f5dc3f23349ee9bb2e6752019c612c0414a269345d18e3c7268844` |
