"use client";

import { Fragment, useState } from "react";
import type { EquipeItem } from "../types";
import { toast } from "sonner";

interface LiderancaExpandedProps {
  item: EquipeItem;
  liderancaExpandida: string | null;
  setLiderancaExpandida: (id: string | null) => void;
}

export function LiderancaExpanded({
  item,
  liderancaExpandida,
  setLiderancaExpandida,
}: LiderancaExpandedProps) {
  if (
    item.kind !== "lideranca" ||
    liderancaExpandida !== item.id ||
    (item.consultorPfs?.length ?? 0) === 0 &&
      (item.comerciais?.length ?? 0) === 0
  ) {
    return null;
  }

  return (
    <Fragment>
      <tr className="bg-gray-50">
        <td colSpan={6} className="p-0 border-t">
          <div className="pl-10 pr-3 py-3 space-y-4">
            {item.comerciais && item.comerciais.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Comerciais desta liderança
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 font-medium text-gray-500">
                        Nome
                      </th>
                      <th className="text-left p-2 font-medium text-gray-500">
                        Email
                      </th>
                      <th className="text-left p-2 font-medium text-gray-500">
                        Função
                      </th>
                      <th className="text-center p-2 font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.comerciais.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-white"
                      >
                        <td className="p-2 font-medium text-gray-800">
                          {c.nome}
                        </td>
                        <td className="p-2 text-gray-600 truncate">
                          {c.email}
                        </td>
                        <td className="p-2 text-gray-600">
                          {c.funcao ? c.funcao.replace(/_/g, " ") : "-"}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              c.status === "ATIVO"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {item.consultorPfs && item.consultorPfs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Consultores PF desta liderança
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                       <th className="text-left p-2 font-medium text-gray-500">
                        Nome
                      </th>
                      <th className="text-left p-2 font-medium text-gray-500">
                        Email
                      </th>
                      <th className="text-center p-2 font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.consultorPfs.map((cp) => (
                      <tr
                        key={cp.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-white"
                      >
                        <td className="p-2 font-medium text-gray-800">
                          {cp.nome}
                        </td>
                        <td className="p-2 text-gray-600 truncate">
                          {cp.email}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              cp.status === "ATIVO"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {cp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
              </div>
            )}
          </div>
        </td>
      </tr>
    </Fragment>
  );
}