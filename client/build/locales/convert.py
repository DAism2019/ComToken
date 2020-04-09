import xlrd # 引入xlrd模块
import json


def convert():
    file = xlrd.open_workbook('multilanguage.xlsx') # 打开excel文件对象
    table = file.sheets()[0]  # 通过索引顺序获取
    rows = table.nrows # 总的行数
    en = {}
    zh = {}
    for r in range(1,rows): # 去除表头所有从第一行开始
        rowData = table.row_values(r) # 获取每一列的数据
        str = rowData[0]
        en_str = rowData[1]
        zh_str = rowData[2]
        en[str] = en_str
        zh[str] = zh_str
    return en,zh


def main():
    en,zh = convert()
    # Writing JSON data
    with open('en.json', 'w') as f:
        json.dump(en, f)
    with open('zh-CN.json', 'w', encoding='utf-8') as f2:
        json.dump(zh, f2,ensure_ascii=False)
    with open('zh.json', 'w', encoding='utf-8') as f3:
        json.dump(zh, f3,ensure_ascii=False)
    print("convert to json success")


main()
