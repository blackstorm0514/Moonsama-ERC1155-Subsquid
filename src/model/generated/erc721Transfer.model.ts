import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {ERC721Token} from "./erc721Token.model"
import {ERC721Owner} from "./erc721Owner.model"

@Entity_()
export class ERC721Transfer {
  constructor(props?: Partial<ERC721Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => ERC721Token, {nullable: false})
  token!: ERC721Token

  @Index_()
  @ManyToOne_(() => ERC721Owner, {nullable: true})
  from!: ERC721Owner | undefined | null

  @Index_()
  @ManyToOne_(() => ERC721Owner, {nullable: true})
  to!: ERC721Owner | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  block!: bigint

  @Column_("text", {nullable: false})
  transactionHash!: string
}
