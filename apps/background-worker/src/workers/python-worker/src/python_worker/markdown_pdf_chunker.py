from __future__ import annotations

import re
from typing import Any
from langchain_core.documents import Document
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
import pymupdf4llm


class MarkdownPdfChunker:
  
    def __init__(
        self,
        max_chunk_chars: int = 2400, 
        chunk_overlap_chars: int = 400,  
    ):
        self.max_chunk_chars = max_chunk_chars
        self.chunk_overlap_chars = chunk_overlap_chars

     
        self.headers_to_split_on = [
            ("#", "header_1"),
            ("##", "header_2"),
            ("###", "header_3"),
        ]
        self.header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=self.headers_to_split_on,
            strip_headers=False,  
        )

  
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.max_chunk_chars,
            chunk_overlap=self.chunk_overlap_chars,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def parse_pdf_to_markdown(self, pdf_path: str) -> str:
       
        return pymupdf4llm.to_markdown(
            doc=pdf_path,
            page_chunks=False,
            write_images=False,
        )

    def chunk_markdown(
        self,
        markdown_text: str,
        base_metadata: dict[str, Any] | None = None,
    ) -> list[Document]:
        """Steps 2, 3 & 4: Split by headers, preserve tables atomically, and fallback split."""
        base_meta = base_metadata or {}

       
        header_docs = self.header_splitter.split_text(markdown_text)
        if not header_docs:
            # Document has no headers: treat entire text as single section
            header_docs = [Document(page_content=markdown_text, metadata={})]

        final_chunks: list[Document] = []

        for doc in header_docs:
            merged_meta = {**base_meta, **doc.metadata}
            content = doc.page_content.strip()
            if not content:
                continue

            section_chunks = self._split_section_preserving_tables(content, merged_meta)
            final_chunks.extend(section_chunks)

        return final_chunks

    def _split_section_preserving_tables(
        self,
        text: str,
        metadata: dict[str, Any],
    ) -> list[Document]:
       # content
       #table    --whole chunk
       #contant
       
        table_pattern = re.compile(
            r"((?:\|[^\n]+\|\r?\n)(?:\|(?:\s*[:-]+[-| :]*\s*)\|\r?\n)(?:\|[^\n]+\|\r?\n?)+)",
            re.MULTILINE,
        )

        chunks: list[Document] = []
        last_idx = 0

        for match in table_pattern.finditer(text):
            start, end = match.span()

          
            pre_table_text = text[last_idx:start].strip()
            if pre_table_text:
                chunks.extend(self._split_or_keep_text(pre_table_text, metadata))

          
            table_content = match.group(0).strip()
            chunks.append(
                Document(
                    page_content=table_content,
                    metadata={**metadata, "is_table": True},
                )
            )
            last_idx = end

       
        remaining_text = text[last_idx:].strip()
        if remaining_text:
            chunks.extend(self._split_or_keep_text(remaining_text, metadata))

        return chunks

    def _split_or_keep_text(
        self,
        text: str,
        metadata: dict[str, Any],
    ) -> list[Document]:
       
        if len(text) <= self.max_chunk_chars:
            return [
                Document(
                    page_content=text,
                    metadata={**metadata, "is_table": False},
                )
            ]

        sub_texts = self.text_splitter.split_text(text)
        return [
            Document(page_content=t.strip(), metadata={**metadata, "is_table": False})
            for t in sub_texts
            if t.strip()
        ]
