## ADDED Requirements

### Requirement: maskサムネイルによるArea一覧

アプリケーションは、制作画面の横スクロールArea一覧の各itemに、対応するdecode済みmaskの形状を示すサムネイルを表示しなければならない（SHALL）。visibleなArea名、initial colorの値、fill状態をArea item内へ表示してはならない（MUST NOT）。Area名は支援技術が操作対象を区別するためのaccessible nameとして提供しなければならない（MUST）。

#### Scenario: Area一覧を表示する
- **WHEN** 1件以上のAreaを持つ制作sessionで制作画面を開く
- **THEN** アプリケーションは各Area itemへ対応するmask形状のサムネイルを表示し、既存の中央固定選択枠を維持する

#### Scenario: maskに離れた複数形状が含まれる
- **WHEN** Areaのmaskが離れた複数の不透明形状または中間alphaを含む
- **THEN** アプリケーションはそのalpha全体を一つのAreaサムネイルとして表示する

#### Scenario: サムネイルを描画できない
- **WHEN** AreaサムネイルのCanvas描画に失敗する
- **THEN** アプリケーションはAreaの選択操作と中央固定選択枠を維持する
