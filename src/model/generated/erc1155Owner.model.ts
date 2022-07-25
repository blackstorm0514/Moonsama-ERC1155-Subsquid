import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {ERC1155TokenOwner} from "./erc1155TokenOwner.model"

@Entity_()
export class ERC1155Owner {
  constructor(props?: Partial<ERC1155Owner>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @OneToMany_(() => ERC1155TokenOwner, e => e.owner)
  ownedTokens!: ERC1155TokenOwner[]
}
