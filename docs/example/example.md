# Feature List

+ Take notes using Markdown syntax.
+ Convert Markdown files to HTML in real-time, accessible via a browser.
+ Support searching across all Markdown files.
+ Access from other computers via the local machine's IP.
+ Support setting which IPs are allowed to access the notes.

# Some Common Markdown Syntax
Here are some common Markdown syntax examples.

## Bold, Italic, Strikethrough
*Italic text (one \*)*  
_Italic text (one \_)_

**Bold text (two *)**  
__Bold text (two _)__

~~Strikethrough (two ~)~~

## Font Size and Color
Markdown editors do not natively support font styles, sizes, or colors. However, since Markdown supports HTML tags, these features can be implemented with inline HTML.

<font color=#FF000 >Red</font>  
<font color=#008000 >Green</font>  
<font color=#FFFF00 >Yellow</font>

<font size=2 >Size 2 font</font>  
<font size=5 >Size 5 font</font>

### Code Blocks and Text Blocks
`````
console.log("hello");
`````

`````
Text block
`````

## Images
![](images/de.jpg)

## Audio
<audio controls loop src="audio/25_L23_2a_b.mp3"></audio>

## Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Content1 | Content2 | Content3 |

### How to Format Tables
Install the plugin in VSCode: Markdown Table Formatter

Right-click on the table, select "Format Document with...", then choose Markdown Table Formatter to format.