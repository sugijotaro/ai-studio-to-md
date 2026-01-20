const fs = require("fs");
const path = require("path");

// コマンドライン引数の解析
const args = process.argv.slice(2);
let inputFilePath = null;
const options = {
  includeThoughts: false, // デフォルトは思考プロセスを含めない
};

args.forEach((arg) => {
  if (arg === "--thoughts" || arg === "-t") {
    options.includeThoughts = true;
  } else if (!arg.startsWith("-")) {
    inputFilePath = arg;
  }
});

if (!inputFilePath) {
  console.error(
    "エラー: JSONファイルのパスを指定してください。\n使用法: node convert.js <ファイル名.json> [--thoughts]",
  );
  process.exit(1);
}

// 出力ディレクトリの作成
const outputDir =
  path.basename(inputFilePath, path.extname(inputFilePath)) + "_export";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// JSONの読み込み
const rawData = fs.readFileSync(inputFilePath, "utf8");
const json = JSON.parse(rawData);

let mdContent = `# Chat Session Export\n\n`;
mdContent += `**Model:** ${json.runSettings?.model || "Unknown"}\n`;
mdContent += `**Exported:** ${new Date().toLocaleString()}\n\n---\n\n`;

// チャンク（発言）ごとの処理
const chunks = json.chunkedPrompt?.chunks || [];

chunks.forEach((chunk, index) => {
  const role = chunk.role === "user" ? "👤 User" : "🤖 Model";

  mdContent += `## ${role}\n\n`;

  // 1. インラインファイル（Base64）の処理
  if (chunk.inlineFile) {
    const mimeType = chunk.inlineFile.mimeType;
    const data = chunk.inlineFile.data;

    // テキストファイル系ならデコードして中身を表示・保存
    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      const decodedText = Buffer.from(data, "base64").toString("utf-8");

      // 別ファイルとして保存
      const attachmentFileName = `attachment_${index}.txt`;
      fs.writeFileSync(path.join(outputDir, attachmentFileName), decodedText);

      mdContent += `### 📎 添付ファイル (${mimeType})\n`;
      mdContent += `> ファイル名: [${attachmentFileName}](./${attachmentFileName}) に保存しました\n\n`;

      // MD内にも折りたたみで表示
      mdContent += `<details><summary>添付ファイルの中身を見る</summary>\n\n`;
      mdContent += `\`\`\`text\n${decodedText.slice(0, 2000)}${decodedText.length > 2000 ? "\n... (省略) ..." : ""}\n\`\`\`\n`;
      mdContent += `\n</details>\n\n`;
    } else {
      mdContent += `*[バイナリファイル (${mimeType}) が含まれています]*\n\n`;
    }
  }

  // 2. 通常テキストの処理
  // 2. テキストとPartsの処理
  // Partsがある場合はPartsを優先して処理（思考プロセスの除外やストリーミング再構成のため）
  if (chunk.parts && Array.isArray(chunk.parts) && chunk.parts.length > 0) {
    chunk.parts.forEach((part) => {
      // 思考プロセス (Thinking) の場合
      if (part.thought || part.isThought) {
        if (options.includeThoughts) {
          mdContent += `> 🧠 **Thinking Process**\n> \n`;
          // 引用記号を行頭につける
          const thoughtText = part.text.replace(/\n/g, "\n> ");
          mdContent += `> ${thoughtText}\n\n`;
        }
      } else if (part.text) {
        // 通常テキストはそのまま結合（勝手に改行を入れない）
        mdContent += part.text;
      }
    });
    // 最後に改行を入れる
    mdContent += "\n\n";
  } 
  // Partsがない場合のフォールバック
  else if (chunk.text) {
     // チャンク全体が思考プロセスの場合
     if (chunk.isThought) {
        if (options.includeThoughts) {
            mdContent += `> 🧠 **Thinking Process**\n> \n`;
            const thoughtText = chunk.text.replace(/\n/g, "\n> ");
            mdContent += `> ${thoughtText}\n\n`;
        }
     } else {
        mdContent += `${chunk.text}\n\n`;
     }
  }
});

// メインのMDファイルを書き出し
const outputMdPath = path.join(outputDir, "conversation.md");
fs.writeFileSync(outputMdPath, mdContent);

console.log(`✅ 変換完了しました！`);
console.log(`出力先フォルダ: ${outputDir}`);
console.log(`メインファイル: ${outputMdPath}`);
