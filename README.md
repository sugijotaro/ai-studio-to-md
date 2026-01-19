# Google AI Studio Export Converter

Google AI StudioからエクスポートされたJSONファイルを読み込み、人間が読みやすいMarkdown形式に変換するツールです。Base64エンコードされた添付ファイルも元のテキストに戻して保存します。

## 使い方

### 1. 準備

1. Node.jsがインストールされていることを確認してください。
2. Google AI StudioからエクスポートしたJSONファイルを `json_files` フォルダ（または任意の場所）に配置します。
   - サンプルとして `json_files/GoogleHistory.json` が用意されています。

### 2. 実行

ターミナルで以下のコマンドを実行します。

```bash
node convert.js <JSONファイルのパス>
```

例：サンプルファイルの `GoogleHistory.json` を変換する場合

```bash
node convert.js json_files/GoogleHistory.json
```

### 3. 出力結果

実行すると、元のファイル名に基づいたフォルダ（例：`chat_export`）が作成され、その中に以下のファイルが生成されます。

- **conversation.md**: メインの会話ログ。Markdown対応のエディタで見やすく表示されます。
- **attachment_x.txt**: Base64で埋め込まれていたテキストファイルの中身が個別のファイルとして抽出されます。
