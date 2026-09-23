# Moment Palette 開発ロードマップ

> ステータス: フェーズ5進行中・次のchangeは`implement-photo-fill`
>
> 最終更新日: 2026-09-23

## 目的

この文書は、複数のセッションにまたがる開発の現在地、次に行う作業、OpenSpec changeを開始する順序を示す。プロダクト要求の正本は `docs/vision.md`、実装対象の正式な仕様は `openspec/specs/` とする。

## 現在地

- 最初のOpenSpec change `establish-frontend-foundation` は完了し、archive済みである。
- Gitリポジトリは初期化済みである。
- Vue 3、Vite、TypeScriptによるアプリケーションシェル、ルーティング、日本語・英語表示、モバイル向け基本レイアウトを実装済みである。
- Node.jsとpnpmの固定、単体テスト、型検査、lint、format、production build、開発者向け文書を整備済みである。
- `docs/vision.md`を実装開始の基準版として合意済みである。未決事項は、実装前にすべて解消するのではなく、該当するchangeまたはF/Sで扱う。
- 配信基盤は、Azure Static Web Apps Free、非公開Azure Blob Storage、SWAマネージドAPIを使用する方針に決定した。
- テンプレートカタログはBlob上のJSONで管理し、Cosmos DBは使用しない方針に決定した。
- Figma連携を導入済みで、画面ラフからデザインを検討できる状態である。
- [MomentPaletteのFigma](https://www.figma.com/design/K2tfDw1Wj9pQJ2heFbh7FJ/MomentPalette?node-id=0-1&t=P4QjS9z2QLy0duFM-1)で、主要画面、画面遷移、エリア選択、カメラ、写真、単色塗り、完成・共有の操作案を作成済みである。
- 初期リリースには、カメラ撮影、端末内の写真、カラーパレットによる単色塗りの三つを含める方針に決定した。
- F/S専用のAzure Static Web Apps Free、Bicep、GitHub Actions、SPA設定、PRプレビューを実装済みである。
- `main`の固定F/S URLとPRプレビューをiPhone 15（iOS 26）のSafari・Chromeで確認済みである。Android Chromeは実機を確保できるリリース後に確認する。
- `establish-preview-deployment`はverifyとmain specsへの同期を完了し、archive済みである。
- フェーズ3の先行change `validate-camera-compositing`は実装とiPhone実機確認を完了し、delta specを同期せずarchive済みである。
- 写真選択、標準APIによるdecode、EXIF Orientation、高解像度縮小、位置・倍率調整、mask合成を検証する`validate-photo-import`は、iPhone 15（iOS 26）のSafari・Chromeで実装と実機確認を完了し、delta specを同期せずarchive済みである。
- 画像保存と共有を検証する`validate-image-sharing`は、iPhone 15（iOS 26）のSafari・Chromeで実装と実機確認を完了し、delta specを同期せずarchive済みである。
- Azureテンプレート配信とリリース継続性を検証する`validate-azure-template-delivery`は、実装、iPhone実機確認、verifyを完了し、delta specを同期せずarchive済みである。
- フェーズ3のF/S結果をvision、画面遷移、UI状態、フロントエンド方針、Azure構成、template形式へ反映するフェーズ4を完了した。
- フェーズ5の最初のchange `establish-creation-session`は、Startからtemplate選択、初期作品を表示する制作画面までの実装、verify、main specsへの同期、archiveを完了した。
- フェーズ5の`implement-camera-fill`は、Artwork更新、camera resource所有、製品camera導線、中央固定Area selector、F/Sコード移行を実装し、iPhoneのSafari・Chromeによる実機確認、verify、main specsへの同期、archiveを完了した。
- `unify-screen-layout`は、既存画面で判明したheader位置と戻る操作の重複の共通化、iPhone Safari・Chromeによる実機確認、verify、main specsへの同期、archiveを完了した。
- `implement-completed-artwork`は、現在のArtworkからの1080×1080 PNG生成、完成確認、長押し保存、Web Share、共有文コピー、作品更新・session終了時の完成PNG resource破棄を実装し、format、lint、型検査、単体テスト、production build、iPhone Safari・Chromeでの実機確認、verify、main specsへの同期を完了した。Web Share非対応・失敗は実機で再現できなかったため、`navigator.canShare()`がfalseの場合と共有Promiseの失敗を分類し、画像と手動コピー可能な共有文を維持する単体テストで確認した。Android Chromeは端末確保後の回帰項目とする。
- Android Chromeの実機確認は端末を確保できるリリース後のフォロー項目とし、今回のF/SはiPhone 15（iOS 26）のSafari・Chromeを完了条件とする。

## 実行順序

今後は、原則として次の順序で進める。F/Sの結果によって後続changeの分割や順序を見直すことはあるが、検証前に本番設計を固定しない。

1. フロントエンド基盤とソースアーキテクチャを決める。
2. 実機F/Sに使うHTTPSの最小デプロイ環境を用意する。
3. クライアント画像処理とAzureテンプレート配信のF/Sを行う。
4. F/S結果をvision、画面仕様、アーキテクチャへ反映する。
5. メイン機能をユーザーが確認できる縦切りのchangeで実装する。
6. 本番用のAzure構成、テンプレート配信、リリース継続性を実装する。
7. 初期リリース要件を満たしていることを確認し、必要な調整を行う。

## OpenSpec changeの運用方針

- 本実装へ残る通常changeは、完了確認後にdelta specをmain specsへ同期してarchiveする。
- 技術F/Sは、検証する問い、成功条件、失敗条件、破棄条件を定めた独立changeとして扱う。
- F/Sのdelta specはmain specsへ同期せず、archive時に `--skip-specs` を使用する。
- F/Sの結果と採否理由は `docs/spikes/` へ記録し、正式要件は後続の通常changeで改めてspec化する。
- F/Sコードは本実装への流用を意識して作るが、`spikes/`など本番コードと分離した場所へ置き、検証完了時に昇格、設計を保った再実装、削除のいずれかを明示的に判断する。
- 座標計算、移動範囲、マスク処理、Canvas合成などのブラウザ非依存ロジックは、単体テストを伴う昇格候補とする。F/S専用画面、固定データ、実験用ログや操作は原則として削除する。
- change名と分割はこの文書の候補へ固定せず、proposalを作成する時点の責務と検証可能性を優先する。

## フェーズと完了条件

### 0. 要求と画面の基準版を作る

ステータス: 完了

主な作業:

- `docs/vision.md`の未決事項を、実装開始に必要な範囲まで解消する。
- タイトル、テンプレート選択、制作、カメラ、写真調整、単色塗り、完成確認の画面ラフを作る。
- 主要な画面遷移、操作状態、権限・エラー状態を確認する。
- UIライブラリ選定に必要なコンポーネントを洗い出す。

完了条件:

- プロダクトの目的、初期スコープ、基本フロー、対象環境が合意されている。
- カメラを使用する主要導線がワイヤーフレームで確認できる。
- 技術F/Sで検証すべき問いが列挙されている。
- `docs/vision.md`を実装開始の基準版として扱うことに合意している。

このフェーズの静的デザイン・文書作業にはOpenSpec changeを作成しない。

### 1. フロントエンド基盤を構築する

ステータス: 完了

対応OpenSpec change: `establish-frontend-foundation`

想定範囲:

- Vue 3、Vite、TypeScript。
- パッケージマネージャー。
- 単体テスト、lint、format。
- 基本ディレクトリ構成と責務分割のルール。
- 画面、ユースケース、作品状態、画像処理、ブラウザAPI、外部データ取得の依存方向。
- カメラ、Canvas、Web Share、テンプレート取得を差し替え可能にする境界。
- 環境変数とローカル開発設定。
- 最小限のアプリシェル。
- ソース構成とモジュール依存を示すアプリケーションアーキテクチャ資料。
- README、`.gitignore`、AGENTS.mdの更新。

UIコンポーネントライブラリは、画面検討の結果が不足している場合、このchangeでは導入しない。

このchangeは、`openspec-propose`で一括生成しない。proposalの合意後に、相互に参照しながらspecsとdesignを作成・レビューし、両方の合意後にtasksを作成する。フォルダ構成、責務分割、採用ライブラリ、依存ルールは主にdesignで検討し、合意後に `docs/architecture/` へ図と文章で残してから実装する。

### 2. 実機F/S用の最小デプロイ環境を構築する

ステータス: 完了

対応OpenSpec change: `establish-preview-deployment`

目的は、iPhoneやAndroidの実機からHTTPSでアクセスできる検証環境を、最小構成で早期に用意することである。本番用のBlob、マネージドAPI、SAS URL、キャッシュ、リリース継続性まではこのchangeで確定しない。

想定範囲:

- フェーズ1で作成した最小限のVueアプリをAzure Static Web Appsへデプロイする。
- ビルド、単体テスト、静的解析を実行するGitHub Actionsを用意する。
- 最小限の `staticwebapp.config.json` を用意する。
- 検証用SWAリソースを再現可能にする最小限のIaCを用意する。
- 実機からHTTPSでアクセスし、F/S用画面を表示できることを確認する。
- 暫定的なAzure構成図を `docs/architecture/` へ配置する。

このchangeは通常changeとして扱う。F/S後にAzure構成が変わった場合は、フェーズ6の本番構築changeで設定、IaC、構成図を更新する。

完了結果:

- BicepからF/S専用SWA FreeをEast Asiaへ再現可能に構築した。
- `main`の固定F/S環境と、`main`向けPRの一時プレビュー環境をGitHub Actionsから配信できる。
- 固定F/S URLは<https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/>である。
- PRの作成・更新・終了、品質検査失敗時のデプロイ抑止、SPA直接アクセス、存在しない静的アセットの404を確認した。
- iPhone 15（iOS 26）のSafari・ChromeでPR環境と固定環境を確認した。Android Chromeはリリース後のフォロー項目とした。
- Blob Storage、マネージドAPI、SAS URL、固定dev環境、長期devブランチ、カスタムドメインは追加していない。

### 3. 中核技術のF/Sを行う

ステータス: 完了

OpenSpec change候補:

- `validate-camera-compositing`（完了・archive済み）
- `validate-photo-import`（完了・archive済み）
- `validate-image-sharing`（完了・archive済み）
- `validate-azure-template-delivery`（完了・archive済み）

カメラ・画像処理の検証候補:

- iPhone Safari、iPhone Chrome、Android Chromeでのカメラ起動と権限処理。
- 前面・背面カメラの切替。
- 不透明部分と完全透過部分から成るPNGマスクを用いたスルー映像の切り抜き。
- 離れた複数形状を一つのエリアとして持つPNGマスクの扱い。
- 現在の作品とカメラ全体のスルー映像を連続的に比較する表示比率スライダー。
- 編集領域内から始めた1本指ドラッグによる位置移動と、ピンチによる拡大率の変更。
- 編集領域へ局所的なタッチ制御を適用し、ブラウザのページスクロールやページズームと競合しないこと。
- 撮影フレームの固定、撮り直し、上書き。
- 複数エリアの合成。
- 制作画面から完成確認画面へ移る時点での1080×1080 PNG Blob生成と、統合済み画像の再利用。
- 完成確認後に制作へ戻って変更した場合のPNG破棄と再生成。
- 完成PNGを画像要素として表示し、iPhone Safari、iPhone Chrome、Android Chromeで長押し保存できること。
- Web Share APIでPNGと固定文・ハッシュタグ・URLを渡し、OS共有シートから写真へ保存できる場合の挙動。
- iPhoneの画像選択でOSが表示する「写真ライブラリ」「写真を撮る」「ファイルを選択」の挙動。
- OSの画像選択メニューからカメラを起動した場合に、通常の撮影後、アルバム画像と同じ位置・倍率調整へ移行できること。
- アルバムまたはファイルから選んだ画像に対する、カメラと同じ表示比率スライダー、1本指の位置調整、ピンチズーム。
- HEIC・HEIF・JPEG・PNGなど、対応環境から選択され得る画像形式のデコード可否。
- EXIF Orientationを含む画像の向きと、Canvas描画時の表示結果。
- 高解像度画像の読み込み、縮小、メモリ使用量、Object URLなど一時リソースの解放。
- 色空間や透過情報の違いが、画面表示と完成PNGへ与える影響。
- 読み込めない形式、破損画像、選択キャンセル時のエラー処理。
- OS・ブラウザ標準のカラーピッカーとアプリ独自UIのどちらが、正式対応環境と画面要件に適するか。

低優先度の検証候補:

- PNGマスクから選択中エリアの輪郭画像を事前生成するスクリプトと、表示品質・アセット容量。
- 輪郭表示がない場合でも、小さいエリアや離れた複数形状を持つエリアを認識できるか。

Azureテンプレート配信とリリースの検証候補:

- Azure Static Web Apps CLIを使い、VueフロントエンドとマネージドAPIを同一ホストでローカル実行できること。
- マネージドAzure Functionsから、非公開Blob上のカタログJSONとテンプレートアセットを読み取れること。
- `GET /api/templates`で公開状態と公開期間を判定し、読み取り専用・短期間のSAS URLを返せること。
- Blobへの接続に必要な秘密情報をApplication Settings相当の環境変数から取得し、フロントエンドへ露出しないこと。
- iPhone Safari、iPhone Chrome、Android ChromeからSAS URLを使ってアセットを取得できること。
- BlobのCORS設定と画像の取得方法が、Canvasへの描画やPNG生成を妨げないこと。
- カタログJSON、APIレスポンス、テンプレートアセットのキャッシュと更新反映の挙動。
- SAS URLの有効期間中に、通常の制作、保存、共有を完遂できること。
- Azure Static Web Appsへ制作中に新しいバージョンをデプロイしても、現在のセッションを保存・共有まで継続できること。
- Start時にリリース情報JSONを再検証し、新しいバージョンがある場合だけ再読み込みを案内できること。
- コード分割や遅延読み込みによって、制作中に削除済みの旧ビルドアセットを要求しない構成にできること。

F/Sコードは本番コードから隔離する。完了時にはファイルまたはモジュール単位で、後続の通常changeへ昇格するか、設計だけを採用して再実装するか、削除するかを記録する。

`validate-camera-compositing`の完了結果:

- iPhone 15（iOS 26）のSafari・Chromeで、カメラ取得、前面・背面切替、4エリアのマスク合成、pan、pinch、撮影、撮り直し、1080×1080 PNG生成、権限拒否、再試行、track停止を確認した。
- Canvas 2Dで両ブラウザとも概算60fps、撮影0〜4.0ms、PNG生成約100msとなり、WebGLを追加せず本実装へ進められると判断した。
- 前面カメラはプレビューと撮影結果をともに鏡像とし、表示比率の中間値でも選択中映像を薄くしない合成方式を採用した。
- ブラウザ非依存の座標・ジェスチャー・scene処理とcamera port・browser adapterは本実装への昇格候補とし、F/S専用UI、route、固定アセット、診断表示は削除対象とした。
- 写真取り込み、画像保存・共有、Android実機、Azureからのテンプレート配信は後続changeで検証する。

`validate-photo-import`の完了結果:

- iPhone 15（iOS 26）のSafari・Chromeで、写真ライブラリ、OSカメラ、ファイル選択、JPEG、HEIC、alpha PNG、EXIF Orientation、pan、pinch、余白を残した確定、選び直し、破損画像からの再試行を確認した。
- HEIF由来写真は写真ライブラリではJPEGへ変換され、ファイルではHEICのまま返却された。どちらも`createImageBitmap()`でdecodeできたため、拡張子やMIME typeだけで拒否せず実decodeを正本とする。
- 3024×4032の写真は4096px・12MP候補で3000×4000、2160px候補で1620×2160となった。処理時間と操作性能に実用上の差がなく、最大4倍でわずかに画質が良い4096px・12MP候補を本実装の初期上限とする。
- pointer描画の画面更新周期への集約と、選択中エリアの前後に分けた静的レイヤーキャッシュにより、4エリア確定後の置換を含めて滑らかに操作できた。6レイヤー分割は自動テストで確認済みとし、実際の6レイヤーtemplateで後日再計測する。
- 写真形式によって配置モードを分けず、すべての写真をcover状態から縮小して余白を残せる方式を採用する。透過部分と余白には対象エリアの初期カラーを表示する。
- Android Chrome、広色域・HDRの厳密な色保持、6レイヤー実機templateは後続の確認項目とする。

`validate-image-sharing`の完了結果:

- iPhone 15（iOS 26）のSafari・Chromeで、1080×1080 PNGの長押し保存、共有シートからの保存、共有キャンセル、共有文コピー、Blob再利用、再生成を確認した。初回生成はSafari 102.0ms、Chrome 75.0msで、ブラウザと方式をまたぐ10回以上の操作でも継続的な劣化はなかった。
- PNG bytesと`.png`名を保った`text/plain`の基準方式、標準の`image/png`方式、画像のみ方式は、両ブラウザですべて`canShare()`が`true`になった。基準・標準方式ともX、LINE、Bufferへ画像、固定文、ハッシュタグ、URLを渡せた。
- Blueskyは基準・標準方式とも画像だけを受け取った。ブラウザやFile typeではなく共有先側の対応差と判断し、アプリはOSまたは共有先への引き渡しまでを責務とする。
- 初期の製品実装では、今回のiPhone実機結果と既存アプリでのiPhone・Android共通の3年以上の運用実績を根拠に、`text/plain`方式を共有の基準経路として採用する。`image/png`方式は将来のAndroid比較候補とし、画像のみ方式は製品UIへ追加しない。
- 通常の画像要素による長押し保存、共有文のClipboard fallback、一つのPNG Blobを表示と再共有へ使い、再生成・画面離脱時にobject URLを破棄する方式を本実装へ引き継ぐ。
- 共有結果分類、resource所有権、portとbrowser adapterは本実装への昇格・再実装候補とし、F/S専用route、Canvas fixture、三経路比較UI、診断表示は削除対象とする。Android ChromeでのMoment Palette固有の確認は、端末を確保した後の回帰項目とする。

`validate-azure-template-delivery`の完了結果:

- F/S用SWAへprivate Blob StorageとNode.js 22のマネージドAPIを追加し、公開中templateの個別assetへ読み取り専用・HTTPS限定・60分のService SASを発行できた。匿名取得とSASによる書き込みは拒否された。
- Blob CORSは動的なPRプレビューに対応するためorigin `*`、methodを`GET`・`HEAD`・`OPTIONS`だけとする。制作開始時に選択templateの線画と全maskを並列取得・decodeし、以後はSASを再利用しない。
- iPhone 15（iOS 26）のSafari・Chromeで、Build B配信後もStart済みBuild A旧tabが追加requestなしでPNG生成、長押し保存、共有を完遂した。新規tabではfrontend、API、`release.json`のapp versionとbuild IDが一致した。
- 未開始の旧build tabではStart前にbuild不一致を検出して再読み込みを案内し、Start済みsessionは強制再読み込みしなかった。SAS期限後も取得済みbytesからPNG生成、保存、共有を完遂した。
- `index.html`は`no-cache`、APIと`release.json`は`no-store`、hash付きJavaScript・CSSとrevision付きtemplate assetは1年`immutable`とする。旧assetはcatalogから除外して24時間後に削除し、14日のsoft deleteとversioningを復旧手段とする。
- API契約・公開判定・SAS発行・build metadata・IaC・workflowは本実装への昇格候補、フロントのportとsession所有権は設計を保った再実装候補、F/S専用route・診断UI・手動compositorは削除対象とする。Android Chromeは端末確保後の回帰項目とする。

### 4. F/S結果を要求とデザインへ反映する

ステータス: 完了

主な作業:

- `docs/spikes/`へ検証結果と採否理由を記録する。
- 必要に応じて `docs/vision.md` を更新する。
- `docs/design/`の画面仕様を更新する。
- UIコンポーネントライブラリ、状態管理、テンプレート形式を決定する。
- Blobへの認証方式、SAS URLの有効期間、CORS、キャッシュ、削除猶予期間を決定する。
- SWAへのデプロイをまたぐ制作セッション継続方式を決定する。
- 本実装changeへ移す正式要件を整理する。

完了結果:

- 4件のF/Sについて、検証結果、採否、制約、コードの扱いを`docs/spikes/`へ記録し、索引から後続文書をたどれるようにした。
- `docs/vision.md`をF/S結果反映済みの本実装開始基準版とし、写真の実decode、4096px・12MP上限、初期のUI・状態管理方針を反映した。
- `docs/design/screen-flow.md`と`docs/design/ui-states.md`を追加し、Start、template準備、camera、photo、color、完成、保存、共有の遷移、失敗状態、resource所有権を定めた。
- UI component libraryとPiniaは初期リリースへ導入せず、native要素、製品固有component、Vue composable、`app/`がprovideする単一の制作sessionを採用した。再評価条件も明文化した。
- F/S catalogへ`tags`とmask単位の`initialColor`を加えたschema version 1、順序、asset不変条件、API response境界を`docs/architecture/template-format.md`へ定めた。
- private Blob、Blob単位・read-only・HTTPS限定・60分のService SAS、CORS origin `*`と限定method、resource別cache、旧assetの24時間削除猶予、14日soft deleteとversioningを初期方針として確定した。
- Start前のbuild identity照合、template選択後の全asset取得・decode、制作開始後の追加取得なし、次のStartでの更新確認をsession継続方式として確定した。

本実装changeへの引き継ぎ:

- 各F/Sのdelta specはmain specsへ同期していない。フェーズ5の各changeは、対象となる採用判断を製品要求としてdelta specへ記述する。
- 最初の縦切りは、Start時の整合性確認、template一覧と全asset準備、単一session、camera撮影、作品更新、1080×1080 PNG生成、長押し保存・共有までを一つの確認可能な導線としてproposalで再評価する。
- 写真取り込みと単色塗りは、最初のcamera導線で確立した作品状態とcompositorへ後続changeで追加する。
- F/S専用route、page、診断UI、固定assetは、対応する製品moduleを移植または再実装したchangeで削除する。

### 5. 主要導線を本実装する

ステータス: 進行中（1〜4を完了・archive済み）

本実装は、ユーザーが確認できる能力と画面横断の整備を次の六つの通常changeへ分ける。各changeを単独で検証可能にし、`unify-screen-layout`を挟みつつ、`establish-creation-session`、`implement-camera-fill`、`implement-completed-artwork`でタイトルからカメラ撮影、完成、保存・共有までの縦切りを完成させる。

1. `establish-creation-session`（完了・archive済み）
   - Start、app version・build ID確認、template一覧・選択、全asset準備、制作画面までの遷移を実装する。
   - `Template`、`Artwork`、`Area`、制作sessionのdomainとresource所有権を定める。
   - template取得port、開発用catalog、製品API仕様書、読み込み・空・更新必要・取得失敗状態を実装・文書化する。
2. `implement-camera-fill`（完了・archive済み）
   - 中央固定のエリア選択、カメラ権限、前面・背面切替、pan、pinch、比較slider、撮影、撮り直し、上書きを製品導線へ実装する。
   - camera frameを作品状態へ反映し、Canvas 2D compositorへ統合する。
3. `unify-screen-layout`（完了・archive済み）
   - タイトル、テンプレート選択、制作画面でheaderのsafe area、上端・左右余白、最大幅を共有する画面shellを`shared/ui`へ実装する。
   - 戻るボタンの見た目とclick通知を再利用componentへまとめ、遷移先の決定、遷移前のsession破棄、router操作は各pageの責務として渡せる構造にする。
   - 共通に保つ寸法をCSS custom propertiesへまとめ、画面固有の配置との差を明示する。
   - 言語切替は正式な画面仕様に従ってタイトル画面だけへ配置し、既存三画面のレイアウトを揃える。
4. `implement-completed-artwork`（完了・archive済み）
   - 1080×1080 PNG生成、完成確認、長押し保存、Web Share、共有キャンセル・失敗分類、Clipboard fallbackを実装する。
   - 作品変更と画面離脱に応じたPNG Blob、object URLの再利用・破棄を実装する。
5. `implement-photo-fill`
   - 写真ライブラリ・ファイル選択、標準APIによるdecode、4096px・12MP上限への正規化、位置・倍率調整、余白を含む反映、選び直し、失敗からの復帰を実装する。
6. `implement-solid-color-fill`
   - カラーパレット、単色の反映・上書き、キャンセルを実装し、カラーピッカー方式を製品UIとして確定する。

このフェーズでは、開発用カタログと抽象化したテンプレート取得処理を使ってフロントエンドの主要導線を優先する。Azure上の本番リソースとの接続はフェーズ6で行う。

フェーズ5では、`GET /api/templates`の製品API仕様を一つの文書へまとめる。endpoint、HTTP method、認証レベル、cache header、成功response、error responseとHTTP status、公開判定、SASの権限と有効期間、app version・build ID、秘密情報を返さない境界を記載する。現行F/S実装と`docs/architecture/template-format.md`の製品schemaとの差分に加え、環境ごとのApplication Settingsで`TEMPLATE_CATALOG_FILE`へcatalogのJSONファイル名だけを指定し、APIが固定の`catalog/`配下から取得して、その値をfrontendへ返さない規則も明示する。環境別catalogは共通のrevision付き画像assetを参照できるものとし、フェーズ6のAPI実装・移行判断へ引き継ぐ。

#### F/Sコードの活用方針

- F/Sで実機確認と単体テストが成立した純粋ロジック、port、browser adapter、resource解放処理、test fixtureは、原則として本実装へ昇格または移設して再利用する。
- F/Sコードを理由なく書き直さず、製品の責務、命名、error処理、domain、画面遷移へ適合させるために必要な箇所だけを変更する。
- F/S専用UI、route、診断表示、固定templateは製品UIへ流用しない。対応する製品導線へ検証済み処理を移し、回帰testを維持できたchange内で削除する。
- camera F/Sは`implement-camera-fill`、画像共有F/Sは`implement-completed-artwork`、写真F/Sは`implement-photo-fill`で移行・削除する。Azure配信F/Sはフェーズ6の本番接続まで保持する。

#### UIデザインの変更方針

- Figmaおよび`docs/design/`のUIデザインは、ユーザーが任意のタイミングで更新できる。見た目の変更だけであればOpenSpec changeを必要としない。
- Vue componentは表示と操作の結線へ責務を限定し、domain、制作session、画像処理、browser adapterから分離する。余白、色、文字、配置などの調整がuse caseや画像処理へ波及しない構造にする。
- 共通の見た目はCSS custom propertiesと小さな再利用componentへ寄せ、画面固有の調整を行いやすくする。用途が確定する前に大規模なdesign systemや抽象componentを作らない。
- UI変更が画面遷移、操作方法、errorからの復帰、accessibility、作品の座標系などの要求へ影響する場合は、該当するOpenSpec changeと`docs/vision.md`・`docs/design/`を合わせて更新する。

### 6. 本番用のAzure配信・テンプレート配信基盤を構築する

ステータス: 未着手

ローカルと検証用SWAで主要導線と技術方式を確認した後、F/Sの結果を使って本番用Azure構成を確定し、通常のOpenSpec changeとして実装する。

想定範囲:

- Azure Static Web Apps Free。
- 非公開Azure Blob Storage。
- Blob上のテンプレートカタログJSONとテンプレートアセット。
- `GET /api/templates`を提供するマネージドAzure Functions。
- 環境ごとの`TEMPLATE_CATALOG_FILE`による`catalog/`配下のJSON選択と設定値の検証。
- 環境別catalogから共通のrevision付きtemplate画像を参照する運用と、安全な削除判定。
- 公開状態と公開期間の判定、および読み取り専用・短期間のSAS URL発行。
- Application Settingsによる秘密情報の管理。
- BlobのCORS、論理削除、バージョニングまたは同等の復旧方針。
- カタログ、APIレスポンス、テンプレートアセット、リリース情報のキャッシュ方針。
- 検証結果を反映した `staticwebapp.config.json`。
- フェーズ2で作成したGitHub ActionsとIaCの本番構成への拡張。
- リリース情報JSONと、制作中のセッション継続方式。
- 公開停止したテンプレートアセットの削除猶予期間。
- template metadataとasset情報からschema version 1のcatalog JSONまたはtemplate fragmentを生成し、形式と参照整合性を検証する運用支援ツール。
- Freeプランの容量、帯域、プレビュー環境などの制限を超えていないことの確認。
- IaCと運用・デプロイ手順。
- Markdown内のシンプルなMermaidによるアーキテクチャ図。

本番用のAzureアーキテクチャ図は、このchangeのproposal、specs、designを固めた後、実装開始前までに `docs/architecture/` のMermaid図として作成または更新する。構成変更時は同じchangeで図も更新する。

template catalogの運用支援は、本番用schemaとasset更新手順の確定後に`build-template-catalog-tooling`などの独立した通常changeとして実施する。中核は、入力したtemplate ID、revision、多言語名、公開条件、tag、asset path、area順序、初期カラーからJSONを決定的に生成し、schema、重複ID、安全な相対path、必須asset、画像形式と寸法を検証できる非対話スクリプトとする。初期リリースで固定catalogを手作業できる場合はフェーズ7の後へ送ってよいが、継続的にtemplateを追加する前には用意する。

専用GUIは必須とせず、必要性を別途判断する。Codex SkillなどAI向けの操作インターフェースだけを用意する構成も許可するが、Skillは同じ生成・検証スクリプトを呼び出し、schema規則をpromptだけに依存させない。生成結果は差分確認と自動検査を通してからBlobへ配置し、ツールから直接公開環境を更新しない。

### 7. 初期リリース候補を確認する

ステータス: 未着手

カメラ撮影、単色塗り、過去写真の取り込み、完成PNG、長押し保存、共有、Azure配信、リリース継続性が、初期リリース要件を満たしていることを正式対応環境で確認する。期間限定テンプレート、タグ検索、カードまたはフレーム付き画像を初期リリースへ含めるかは、主要機能の体験を確認してから決定し、追加する場合は個別のOpenSpec changeとして進める。

## 次のセッションで行うこと

1. `implement-photo-fill`を開始する。

## 更新ルール

- フェーズが完了したらステータスと「次のセッションで行うこと」を更新する。
- changeの名前と範囲はproposal作成時の判断を優先し、この文書の候補名へ固定しない。
- ロードマップの変更がプロダクトのゴールに影響する場合は、先に `docs/vision.md` を更新する。
